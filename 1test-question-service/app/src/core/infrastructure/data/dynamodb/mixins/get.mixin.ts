import {
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandInput,
} from '@aws-sdk/lib-dynamodb';

import { BaseMapper } from '@/core/types';

interface GetInput<Model, Entity> {
  key: Partial<Entity>;
  mapper: BaseMapper<Model, Entity>;
}

/**
 * Features:
 * - Perform get command: _get()
 */
export class GetMixin {
  constructor(
    protected readonly client: DynamoDBDocumentClient,
    protected readonly tableName: string,
  ) {}

  protected async _get<Model, Entity extends Record<string, any>>({
    key,
    mapper,
  }: GetInput<Model, Entity>): Promise<Model | null> {
    const params: GetCommandInput = {
      TableName: this.tableName,
      Key: key,
    };

    const getCommandResult = await this.client.send(new GetCommand(params));
    let record: Model | null = null;
    if (getCommandResult.Item) {
      record = mapper.toDomain(getCommandResult.Item as Entity);
    }

    return record;
  }
}
