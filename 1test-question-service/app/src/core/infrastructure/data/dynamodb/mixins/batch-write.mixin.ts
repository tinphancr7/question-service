import {
  BatchWriteCommand,
  BatchWriteCommandInput,
  DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb';

import { BATCH_WRITE_MAX_RETRY } from '@/core/constants';

interface GeneratePutRequests<Model> {
  data: Array<Model>;
  mapEntity: (model: Model) => Record<string, any>;
}

type PutRequest = {
  PutRequest: {
    Item: Record<string, any>;
  };
};

interface BatchWriteParams<Model> extends GeneratePutRequests<Model> {
  chunkSize: number;
}

/**
 * Features:
 * - Perform batch write: _batchCreate()
 */
export class BatchWriteMixin {
  constructor(
    protected readonly client: DynamoDBDocumentClient,
    protected readonly tableName: string,
  ) {}

  private _generatePutRequests<Model>(
    input: GeneratePutRequests<Model>,
  ): Array<PutRequest> {
    const { data, mapEntity } = input;

    return data.map((record) => {
      const params = {
        PutRequest: {
          Item: mapEntity(record),
        },
      };
      return params;
    });
  }

  /**
   * Perform batch write
   * Return unprocessed items if exists
   */
  private async _execute(
    putRequests: Array<PutRequest>,
    chunkSize: number,
  ): Promise<Array<PutRequest>> {
    const unprocessedItems: Array<PutRequest> = [];

    for (let i = 0; i < putRequests.length; i += chunkSize) {
      const commandParams: BatchWriteCommandInput = {
        RequestItems: {
          [this.tableName]: putRequests.slice(i, i + chunkSize),
        },
      };
      const response = await this.client.send(
        new BatchWriteCommand(commandParams),
      );

      if (
        response &&
        response.UnprocessedItems &&
        response.UnprocessedItems[this.tableName] &&
        response.UnprocessedItems[this.tableName].length > 0
      ) {
        const remains = response.UnprocessedItems[
          this.tableName
        ] as PutRequest[];
        unprocessedItems.push(...remains);
      }
    }

    return unprocessedItems;
  }

  /**
   * Perform batch write
   *
   * If remains.length > 0,
   * perform next call with remains as Input
   *
   * MAX_RETRY = 5
   */
  protected async _batchCreate<Model>(input: BatchWriteParams<Model>) {
    const { data, mapEntity, chunkSize } = input;
    const putRequests = this._generatePutRequests({ data, mapEntity });

    let isContinue = true;
    let retry = 0;
    let remains = putRequests;

    while (isContinue) {
      if (retry >= BATCH_WRITE_MAX_RETRY) {
        isContinue = false;
      }

      remains = await this._execute(remains, chunkSize);

      if (remains.length > 0) {
        retry++;
      } else {
        isContinue = false;
      }
    }

    return remains;
  }
}
