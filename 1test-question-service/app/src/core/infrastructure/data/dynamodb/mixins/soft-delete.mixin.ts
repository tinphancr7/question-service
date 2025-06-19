import {
  DynamoDBDocumentClient,
  TransactWriteCommand,
  TransactWriteCommandInput,
} from '@aws-sdk/lib-dynamodb';

import { BaseMapper } from '@/core/types';

export interface SoftDeleteInput<Model, Entity> {
  item: Model;
  itemKey: Partial<Entity>;
  mapper: BaseMapper<Model, Entity>;
  genDeletedEntity: (entity: Entity) => Entity;
}

/**
 * Features:
 * - Perform soft delete command: _softDelete()
 */
export class SoftDeleteMixin {
  constructor(
    protected readonly client: DynamoDBDocumentClient,
    protected readonly tableName: string,
  ) {}

  protected async _softDelete<Model, Entity>({
    item,
    itemKey,
    mapper,
    genDeletedEntity,
  }: SoftDeleteInput<Model, Entity>): Promise<void> {
    const entity = mapper.toEntity(item);
    const deletedEntity = genDeletedEntity(entity) as
      | Record<string, any>
      | undefined;

    const params: TransactWriteCommandInput = {
      TransactItems: [
        {
          Delete: {
            TableName: this.tableName,
            Key: itemKey,
          },
        },
        {
          Put: {
            TableName: this.tableName,
            Item: deletedEntity,
          },
        },
      ],
    };

    await this.client.send(new TransactWriteCommand(params));
  }
}
