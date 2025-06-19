export type Value = string | number | boolean | object | null | undefined;

export type BaseExpr = {
  ExpressionAttributeNames: Record<string, string>;
  ExpressionAttributeValues: Record<string, Value>;
};

export type DynamoDBBaseParams = {
  ExpressionAttributeNames?: Record<string, string>;
  ExpressionAttributeValues?: Record<string, any>;
  [key: string]: any;
};
