export type EventBridgeLambdaConfig = {
  functionName: string;
  handler: string;
  timeout?: number;
  memorySize?: number;
};

// Base filter type for event pattern filtering
type EventPatternFilter =
  | {
      exists?: boolean; // Check if the field exists or not
      prefix?: string; // Match if the field starts with this value
      suffix?: string; // Match if the field ends with this value
      'anything-but'?: string[]; // Match if the field is NOT any of these values
      numeric?: ['=', number] | ['>', number] | ['<', number]; // Numeric comparison
    }
  | string; // Direct string match

// Recursive type to support nested event filters
type EventPatternDetailFilter<DetailType> = {
  [Key in keyof DetailType]?: DetailType[Key] extends Array<infer Element> // If the property is an array
    ? Element extends object
      ? EventPatternDetailFilter<Element>[]
      : EventPatternFilter[] // Allow filters for array elements
    : DetailType[Key] extends object // If the property is an object
      ? EventPatternDetailFilter<DetailType[Key]> // Recurse for nested objects
      : EventPatternFilter[]; // Base case for scalar values
};

// Generic interface for EventBridge event pattern with strict key checking
export interface EventConfig<Detail> {
  eventRuleName: string;
  source: string[];
  'detail-type': string[];
  detail: EventPatternDetailFilter<Detail>; // Apply the recursive filter here
  eventBusName?: string;
  time?: string;
  resources?: string[];
  lambdaConfig: EventBridgeLambdaConfig;
}

export interface EventPattern<DetailType extends string, Detail> {
  detailType: DetailType;
  detail: Detail;
}
