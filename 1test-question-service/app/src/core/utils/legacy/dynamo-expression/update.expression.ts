/**
 * Initialize base for future usage
 *
 * Experiment features(unstable)
 */
import { BaseExpr, DynamoDBBaseParams, Value } from './types';

interface InputParams extends DynamoDBBaseParams {
  UpdateExpression?: string;
}

interface UpdateExpr extends BaseExpr {
  UpdateExpression: string;
}

type DynamoDBUpdateExpressionSetOperation = {
  addKey: (key: string) => DynamoDBUpdateExpressionSetOperation;
  /**
   * Set attribute of entity
   *
   * If value equal to `undefined`, ignore
   */
  attr: (
    name: string,
    value?: Value,
    key?: string,
  ) => DynamoDBUpdateExpressionSetOperation;
  /**
   * Set attribute of entity even if value equal to `undefined`
   */
  optionalAttr: (
    name: string,
    value?: Value,
    key?: string,
  ) => DynamoDBUpdateExpressionSetOperation;
  done: () => DynamoDBUpdateExpression;
};

/**
 * 4-now: SET only
 */
export class DynamoDBUpdateExpression {
  private expr: UpdateExpr;
  private operation?: 'SET' | 'ADD' | 'DELETE';
  constructor() {
    this.expr = {
      UpdateExpression: '',
      ExpressionAttributeNames: {},
      ExpressionAttributeValues: {},
    };
  }

  private _appendCommaIfNeeded() {
    if (this.expr.UpdateExpression.length > 0) {
      this.expr.UpdateExpression += ', ';
    }
  }

  // Should call once
  get set() {
    this.operation = 'SET';
    return this._setOperation();
  }

  private _setOperation(): DynamoDBUpdateExpressionSetOperation {
    return {
      addKey: (key) => this.addFieldKey(key)._setOperation(),
      attr: (name, value, key) => this._setAttr(name, value, key),
      optionalAttr: (name, value, key) =>
        this._setOptionalAttr(name, value, key),
      done: () => this,
    };
  }

  private __setAttr(name: string, value?: Value, key?: string) {
    this._appendCommaIfNeeded();
    if (key) {
      this.expr.ExpressionAttributeValues[`:${name}`] = value;
      this.expr.UpdateExpression += `#${key} = :${name}`;
    } else {
      this.expr.ExpressionAttributeNames[`#${name}`] = name;
      this.expr.ExpressionAttributeValues[`:${name}`] = value;
      this.expr.UpdateExpression += `#${name} = :${name}`;
    }
    return this._setOperation();
  }

  private _setAttr(name: string, value?: Value, key?: string) {
    if (value === undefined || value === null) return this._setOperation();
    return this.__setAttr(name, value, key);
  }

  private _setOptionalAttr(name: string, value?: Value, key?: string) {
    return this.__setAttr(name, value, key);
  }

  private addFieldKey(key: string) {
    this.expr.ExpressionAttributeNames[`#${key}`] = key;
    return this;
  }

  output(): UpdateExpr {
    return {
      UpdateExpression: `${this.operation} ${this.expr.UpdateExpression}`,
      ExpressionAttributeNames: this.expr.ExpressionAttributeNames,
      ExpressionAttributeValues: this.expr.ExpressionAttributeValues,
    };
  }

  /**
   * Override UpdateExpression
   */
  updateParams(params: InputParams) {
    const { UpdateExpression: old } = params;
    const newExpr = `${this.operation} ${this.expr.UpdateExpression}`;
    if (old && old.length > 0) params.UpdateExpression += ` ${newExpr}`;
    else params.UpdateExpression = newExpr;

    params.ExpressionAttributeNames = {
      ...params.ExpressionAttributeNames,
      ...this.expr.ExpressionAttributeNames,
    };
    params.ExpressionAttributeValues = {
      ...params.ExpressionAttributeValues,
      ...this.expr.ExpressionAttributeValues,
    };
  }
}
