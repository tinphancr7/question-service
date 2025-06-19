import {
  BatchGetCommand,
  BatchGetCommandInput,
  DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb';

import { BaseMapper } from '@/core/types';

interface _ExecuteOutput<Model, Entity> {
  items: Array<Model>;
  remains: Array<Partial<Entity>>;
  unprocessedKeys: Array<Partial<Entity>>;
}

interface _ReadInput<Model, Entity> {
  ids: Array<string>;
  mapper: BaseMapper<Model, Entity>;
  genEntityKey: (modelKey: string) => Partial<Entity>;
  genModelKey: (entityKey: Partial<Entity>) => string;
}

interface _ReadOutput<Model> {
  items: Array<Model>;
  unprocessedIds: Array<string>;
}

export const MAX_READ_RETRY = 3;

/**
 * Features:
 * - Perform batch get command: _read()
 */
export class ReadV2Mixin {
  constructor(
    protected readonly client: DynamoDBDocumentClient,
    protected readonly tableName: string,
  ) {}

  private async _executeRead<Model, Entity>(
    keys: Array<Partial<Entity>>,
    mapper: BaseMapper<Model, Entity>,
  ): Promise<_ExecuteOutput<Model, Entity>> {
    const items: Array<Model> = [];
    const remains = keys.slice(100);

    const params: BatchGetCommandInput = {
      RequestItems: {
        [this.tableName]: {
          Keys: keys.slice(0, 100),
        },
      },
    };

    const resp = await this.client.send(new BatchGetCommand(params));

    if (resp.Responses && resp.Responses[this.tableName]) {
      resp.Responses[this.tableName].forEach((entity) => {
        items.push(mapper.toDomain(entity as Entity));
      });
    }

    let unprocessedKeys: Array<Partial<Entity>> = [];
    if (
      resp.UnprocessedKeys &&
      resp.UnprocessedKeys[this.tableName] &&
      resp.UnprocessedKeys[this.tableName].Keys
    ) {
      const keys = resp.UnprocessedKeys[this.tableName].Keys as
        | Array<Partial<Entity>>
        | undefined;

      if (keys && keys.length > 0) {
        unprocessedKeys = keys;
      }
    }

    return {
      items,
      remains,
      unprocessedKeys,
    };
  }

  protected async _readV2<Model, Entity>(
    input: _ReadInput<Model, Entity>,
  ): Promise<_ReadOutput<Model>> {
    const items: Array<Model> = [];
    const { ids, mapper, genEntityKey, genModelKey } = input;
    let keys = ids.map(genEntityKey);
    let retryCount = 0;

    while (keys.length > 0 && retryCount <= MAX_READ_RETRY) {
      const {
        items: newItems,
        remains,
        unprocessedKeys,
      } = await this._executeRead(keys, mapper);
      items.push(...newItems);

      if (unprocessedKeys.length > 0) {
        keys = [...remains, ...unprocessedKeys];

        if (remains.length === 0) {
          retryCount++;
        }
      } else {
        keys = remains;
      }
    }

    return {
      items,
      unprocessedIds: keys.map(genModelKey),
    };
  }
}
