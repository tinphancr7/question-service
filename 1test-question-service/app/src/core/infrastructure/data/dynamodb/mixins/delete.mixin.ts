import {
  DeleteCommand,
  DeleteCommandInput,
  DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb';

/**
 * Features:
 * - Perform delete command: _delete()
 */
export class DeleteMixin {
  constructor(
    protected readonly client: DynamoDBDocumentClient,
    protected readonly tableName: string,
  ) {}

  protected async _delete<Entity>(key: Partial<Entity>): Promise<void> {
    const params: DeleteCommandInput = {
      TableName: this.tableName,
      Key: key,
    };

    await this.client.send(new DeleteCommand(params));
  }
}
