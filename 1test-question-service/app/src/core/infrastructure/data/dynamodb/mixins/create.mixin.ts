import {
  DynamoDBDocumentClient,
  PutCommand,
  PutCommandInput,
} from '@aws-sdk/lib-dynamodb';

import { BaseMapper } from '@/core/types';

/**
 * Features:
 * - Perform put command: _create()
 */
export class CreateMixin {
  /**
   * Because this is a mixin class, the constructor gains no effect, just to satisfy TS Checker
   */
  constructor(
    protected readonly client: DynamoDBDocumentClient,
    protected readonly tableName: string,
  ) {}

  protected async _create<Model, Entity extends Record<string, any>>(
    model: Model,
    mapper: BaseMapper<Model, Entity>,
  ): Promise<Model> {
    const entity = mapper.toEntity(model);
    const commandParams: PutCommandInput = {
      TableName: this.tableName,
      Item: entity,
    };
    await this.client.send(new PutCommand(commandParams));
    return model;
  }
}
