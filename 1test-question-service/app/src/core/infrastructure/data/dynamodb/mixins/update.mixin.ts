import {
  DynamoDBDocumentClient,
  UpdateCommand,
  UpdateCommandInput,
} from '@aws-sdk/lib-dynamodb';

import { BaseMapper, BaseModel, IUpdateMapper } from '@/core/types';
import {
  DynamoDBUpdateExpression,
  capitalizeFirstLetter,
} from '@/core/utils/legacy';

interface UpdateInput<Model, Entity> {
  key: Partial<Entity>;
  data: Partial<Omit<Model, 'id'>>;
  mapper: BaseMapper<Model, Entity>;
}

interface UpdateV2Input<
  Model extends BaseModel<ModelProps>,
  ModelProps,
  Entity,
> {
  key: Partial<Entity>;
  data: Partial<ModelProps>;
  mapper: BaseMapper<Model, Entity> & IUpdateMapper<ModelProps, Entity>;
}

interface UpdateExpression {
  UpdateExpression: string;
  ExpressionAttributeNames: Record<string, any>;
  ExpressionAttributeValues: Record<string, any>;
}

/**
 * Features:
 * - Perform update command: _update()
 * - _updateV2() : same as _update() but well-typed
 */
export class UpdateMixin {
  constructor(
    protected readonly client: DynamoDBDocumentClient,
    protected readonly tableName: string,
  ) {}

  private _genUpdateExpression<Entity>(
    data: Partial<Entity>,
  ): UpdateExpression {
    const entries = Object.entries(data);

    const result: UpdateExpression = {
      UpdateExpression: 'SET',
      ExpressionAttributeNames: {},
      ExpressionAttributeValues: {},
    };

    entries.forEach(([key, value], index) => {
      const capitalizedKey = capitalizeFirstLetter(key);

      if (index === 0) {
        result.UpdateExpression += ` #${capitalizedKey} = :${capitalizedKey}`;
      } else {
        result.UpdateExpression += `, #${capitalizedKey} = :${capitalizedKey}`;
      }
      result.ExpressionAttributeNames[`#${capitalizedKey}`] = capitalizedKey;
      result.ExpressionAttributeValues[`:${capitalizedKey}`] = value;
    });

    return result;
  }

  protected async _update<Model, Entity extends Record<string, any>>({
    key,
    data,
    mapper,
  }: UpdateInput<Model, Entity>): Promise<Model> {
    const updateExpression: UpdateExpression = this._genUpdateExpression(data);

    const params: UpdateCommandInput = {
      TableName: this.tableName,
      Key: key,
      ReturnValues: 'ALL_NEW',
      ...updateExpression,
    };

    const commandResult = await this.client.send(new UpdateCommand(params));
    const record = mapper.toDomain(commandResult.Attributes as Entity);

    return record;
  }

  /**
   * Well-Typed update method
   */
  protected async _updateV2<
    Model extends BaseModel<ModelProps>,
    ModelProps,
    Entity extends Record<string, any>,
  >({
    key,
    data,
    mapper,
  }: UpdateV2Input<Model, ModelProps, Entity>): Promise<Model> {
    const params: UpdateCommandInput = {
      TableName: this.tableName,
      Key: key,
      ReturnValues: 'ALL_NEW',
    };
    const updateEntity = mapper.toUpdateEntity(data);
    const expr = new DynamoDBUpdateExpression();
    const setExpr = expr.set;

    for (const [key, value] of Object.entries(updateEntity)) {
      setExpr.attr(key, value);
    }

    setExpr.done().updateParams(params);

    const result = await this.client.send(new UpdateCommand(params));
    const record = mapper.toDomain(result.Attributes as Entity);
    return record;
  }
}
