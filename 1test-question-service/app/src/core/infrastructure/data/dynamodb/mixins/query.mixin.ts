import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
} from '@aws-sdk/lib-dynamodb';

import { BaseMapper } from '@/core/types';
import { base64 } from '@/core/utils/legacy';

type PaginationQueryInput<Model, Entity> = {
  queryParams: QueryCommandInput;
  offset?: string;
  limit: number;
  mapper: BaseMapper<Model, Entity>;
  genLastKey: (entity: Entity) => Partial<Entity>;
};

type FullQueryInput<Model, Entity> = {
  queryParams: QueryCommandInput;
  mapper: BaseMapper<Model, Entity>;
};

type PartialQueryAllInput<ModelProps, Entity> = {
  queryParams: QueryCommandInput;
  mapPartialDomain: (partialEntity: Partial<Entity>) => Partial<ModelProps>;
};

type PaginationQueryOutput<Model> = {
  items: Array<Model>;
  lastEvaluatedKey?: string;
};

type QueryOneInput<Model, Entity> = {
  index?: string;
  key: Partial<Entity>;
  mapper: BaseMapper<Model, Entity>;
};

type QueryLimitInput<Model, Entity> = {
  queryParams: QueryCommandInput;
  mapper: BaseMapper<Model, Entity>;
};

type PartialQueryLimitInput<ModelProps, Entity> = {
  queryParams: QueryCommandInput;
  mapPartialDomain: (partialEntity: Partial<Entity>) => Partial<ModelProps>;
};

interface KeyExpression {
  KeyConditionExpression?: string;
  ExpressionAttributeNames?: Record<string, any>;
  ExpressionAttributeValues?: Record<string, any>;
}

/**
 * Features:
 * - Paginate Query: _paginate()
 * - Full Query: _all()
 * - Query one: _queryOne()
 */
export class QueryMixin {
  constructor(
    protected readonly client: DynamoDBDocumentClient,
    protected readonly tableName: string,
  ) {}

  private _decodeOffset<Entity>(offset?: string): Partial<Entity> | undefined {
    if (!offset) return undefined;
    return JSON.parse(base64.b64UrlSafeDecode(offset));
  }

  private _encodeOffset<Entity>(offset?: Partial<Entity>): string | undefined {
    if (!offset) return undefined;
    return base64.b64UrlSafeEncode(JSON.stringify(offset));
  }

  protected async _paginate<Model, Entity>(
    input: PaginationQueryInput<Model, Entity>,
  ): Promise<PaginationQueryOutput<Model>> {
    const { queryParams, offset, limit, genLastKey, mapper } = input;

    const items: Array<Model> = [];
    let lastEvaluatedKey = this._decodeOffset<Entity>(offset);
    let isNextQuery = true;

    // ====== Begin ========
    while (isNextQuery) {
      const currentParams: QueryCommandInput = {
        ...queryParams,
        ExclusiveStartKey: lastEvaluatedKey,
      };

      const results = await this.client.send(new QueryCommand(currentParams));

      if (results.Items) {
        for (const item of results.Items as Array<Entity>) {
          if (items.length === limit) {
            isNextQuery = false;
            break;
          }
          items.push(mapper.toDomain(item));
        }

        if (isNextQuery) {
          lastEvaluatedKey = results.LastEvaluatedKey as Partial<Entity>;
          if (!lastEvaluatedKey) isNextQuery = false;
        } else {
          const lastEntity = mapper.toEntity(items[items.length - 1]);
          lastEvaluatedKey = genLastKey(lastEntity);
        }
      } else {
        isNextQuery = false;
        lastEvaluatedKey = undefined;
      }
    }
    // ======= End ========
    const encodedOffset = this._encodeOffset<Entity>(lastEvaluatedKey);

    return {
      items,
      lastEvaluatedKey: encodedOffset,
    };
  }

  protected async _all<Model, Entity>(
    input: FullQueryInput<Model, Entity>,
  ): Promise<Array<Model>> {
    const { queryParams, mapper } = input;

    const models: Model[] = [];
    let lastEvaluatedKey: Record<string, any> | undefined;

    do {
      const currentParams: QueryCommandInput = {
        ...queryParams,
        ExclusiveStartKey: lastEvaluatedKey,
      };

      const results = await this.client.send(new QueryCommand(currentParams));

      if (results.Items) {
        const newModels = results.Items.map((item) =>
          mapper.toDomain(item as Entity),
        );
        models.push(...newModels);
      }

      lastEvaluatedKey = results.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    return models;
  }

  protected async _partialQueryAll<Model, Entity>(
    input: PartialQueryAllInput<Model, Entity>,
  ): Promise<Array<Partial<Model>>> {
    const { queryParams, mapPartialDomain } = input;

    const models: Partial<Model>[] = [];
    let lastEvaluatedKey: Record<string, any> | undefined;

    do {
      const currentParams: QueryCommandInput = {
        ...queryParams,
        ExclusiveStartKey: lastEvaluatedKey,
      };

      const results = await this.client.send(new QueryCommand(currentParams));

      if (results.Items) {
        const newModels = results.Items.map((item) =>
          mapPartialDomain(item as Partial<Entity>),
        );
        models.push(...newModels);
      }

      lastEvaluatedKey = results.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    return models;
  }

  protected async _queryOne<Model, Entity>(
    input: QueryOneInput<Model, Entity>,
  ): Promise<Model | null> {
    const { key, index, mapper } = input;

    const keyExpression = this._genKeyExpression<Entity>(key);

    const queryParams: QueryCommandInput = {
      TableName: this.tableName,
      IndexName: index,
      ...keyExpression,
    };
    const queryResult = await this.client.send(new QueryCommand(queryParams));

    let result: Model | null = null;
    if (queryResult.Items && queryResult.Items.length > 0) {
      result = mapper.toDomain(queryResult.Items[0] as Entity);
    }

    return result;
  }

  protected async _queryLimit<Model, Entity>(
    input: QueryLimitInput<Model, Entity>,
  ): Promise<Array<Model>> {
    const { queryParams, mapper } = input;

    const limit = queryParams.Limit;

    if (limit === undefined) {
      return this._all({ queryParams, mapper });
    }

    const models: Model[] = [];
    let lastEvaluatedKey: Record<string, any> | undefined;

    do {
      const newQueryLimit = limit - models.length;

      const currentParams: QueryCommandInput = {
        ...queryParams,
        Limit: newQueryLimit,
        ExclusiveStartKey: lastEvaluatedKey,
      };

      const results = await this.client.send(new QueryCommand(currentParams));

      if (results.Items) {
        const newModels = results.Items.map((item) =>
          mapper.toDomain(item as Entity),
        );
        models.push(...newModels);
      }

      lastEvaluatedKey = results.LastEvaluatedKey;
    } while (lastEvaluatedKey && models.length < limit);

    return models;
  }

  protected async _partialQueryLimit<ModelProps, Entity>(
    input: PartialQueryLimitInput<ModelProps, Entity>,
  ): Promise<Array<Partial<ModelProps>>> {
    const { queryParams, mapPartialDomain } = input;

    const limit = queryParams.Limit;

    if (limit === undefined) {
      return this._partialQueryAll({ queryParams, mapPartialDomain });
    }

    const models: Partial<ModelProps>[] = [];
    let lastEvaluatedKey: Record<string, any> | undefined;

    do {
      const newQueryLimit = limit - models.length;

      const currentParams: QueryCommandInput = {
        ...queryParams,
        Limit: newQueryLimit,
        ExclusiveStartKey: lastEvaluatedKey,
      };

      const results = await this.client.send(new QueryCommand(currentParams));

      if (results.Items) {
        const newModels = results.Items.map((item) =>
          mapPartialDomain(item as Partial<Entity>),
        );
        models.push(...newModels);
      }

      lastEvaluatedKey = results.LastEvaluatedKey;
    } while (lastEvaluatedKey && models.length < limit);

    return models;
  }

  private _genKeyExpression<Entity>(key: Partial<Entity>): KeyExpression {
    const entries = Object.entries(key);
    const [pkKey, pkValue] = entries[0];
    const [skKey, skValue] = entries[1];

    const keyExpression = {
      KeyConditionExpression: `#${pkKey} = :${pkKey} AND #${skKey} = :${skKey}`,
      ExpressionAttributeNames: {
        [`#${pkKey}`]: pkKey,
        [`#${skKey}`]: skKey,
      },
      ExpressionAttributeValues: {
        [`:${pkKey}`]: pkValue,
        [`:${skKey}`]: skValue,
      },
    };

    return keyExpression;
  }
}
