import { BaseExpr, DynamoDBBaseParams, Value } from './types';

interface FilterExpr extends BaseExpr {
  FilterExpression: string;
}

enum Comparator {
  EQ = '=',
  NE = '<>',
  LE = '<=',
  LT = '<',
  GE = '>=',
  GT = '>',
}

type Operation = {
  eq: (name: string, value: Value, key?: string) => DynamoDBFilterExpression;
  ne: (name: string, value: Value, key?: string) => DynamoDBFilterExpression;
  le: (name: string, value: Value, key?: string) => DynamoDBFilterExpression;
  lt: (name: string, value: Value, key?: string) => DynamoDBFilterExpression;
  ge: (name: string, value: Value, key?: string) => DynamoDBFilterExpression;
  gt: (name: string, value: Value, key?: string) => DynamoDBFilterExpression;
  begins_with: (
    name: string,
    value: string,
    key?: string,
  ) => DynamoDBFilterExpression;
  contains: (
    name: string,
    value: Value,
    key?: string,
  ) => DynamoDBFilterExpression;
  combine: (
    other: DynamoDBFilterExpression,
    /**
     * wrap the expression in `(` and `)`
     */
    wrap?: boolean,
  ) => DynamoDBFilterExpression;
};

enum Separator {
  AND = 'AND',
  OR = 'OR',
}

/**
 * DynamoDB Filter Expression Builder
 *
 * Example:
 * ```ts
 * const expr1 = new DynamoDBFilterExpression()
 *   .and.eq('a', 1)
 *   .or.eq('b', 2)
 * // FilterExpression = '#a = :a OR #b = :b'
 *
 * const expr2 = new DynamoDBFilterExpression().addFieldKey('cKey')
 *    .and.eq('c1', '2', 'cKey')
 *    .or.eq('c2', '3', 'cKey');
 * // FilterExpression = '#cKey = :c1 OR #cKey = :c2'
 *
 * const expr = new DynamoDBFilterExpression()
 *  .and.combine(expr1, true)
 *  .and.combine(expr2, true);
 * // FilterExpression = '(#a = :a OR #b = :b) AND (#cKey = :c1 OR #cKey = :c2)'
 *
 * ```
 */
export class DynamoDBFilterExpression {
  private expr: FilterExpr;
  constructor() {
    this.expr = {
      FilterExpression: '',
      ExpressionAttributeNames: {},
      ExpressionAttributeValues: {},
    };
  }

  private _appendSeparator(s: Separator) {
    if (this.expr.FilterExpression) {
      this.expr.FilterExpression += ` ${s} `;
    }
  }

  private _performComparison(
    s: Separator,
    comparator: Comparator,
    name: string,
    value: Value,
    key?: string,
  ) {
    this._appendSeparator(s);
    if (key) {
      this.expr.ExpressionAttributeValues[`:${name}`] = value;
      this.expr.FilterExpression += `#${key} ${comparator} :${name}`;
    } else {
      this.expr.ExpressionAttributeNames[`#${name}`] = name;
      this.expr.ExpressionAttributeValues[`:${name}`] = value;
      this.expr.FilterExpression += `#${name} ${comparator} :${name}`;
    }
    return this;
  }

  private eq(s: Separator, name: string, value: Value, key?: string) {
    return this._performComparison(s, Comparator.EQ, name, value, key);
  }

  private ne(s: Separator, name: string, value: Value, key?: string) {
    return this._performComparison(s, Comparator.NE, name, value, key);
  }

  private le(s: Separator, name: string, value: Value, key?: string) {
    return this._performComparison(s, Comparator.LE, name, value, key);
  }

  private lt(s: Separator, name: string, value: Value, key?: string) {
    return this._performComparison(s, Comparator.LT, name, value, key);
  }

  private ge(s: Separator, name: string, value: Value, key?: string) {
    return this._performComparison(s, Comparator.GE, name, value, key);
  }

  private gt(s: Separator, name: string, value: Value, key?: string) {
    return this._performComparison(s, Comparator.GT, name, value, key);
  }

  private begins_with(s: Separator, name: string, value: string, key?: string) {
    this._appendSeparator(s);
    if (key) {
      this.expr.ExpressionAttributeValues[`:${name}`] = value;
      this.expr.FilterExpression += `begins_with(#${key}, :${name})`;
    } else {
      this.expr.ExpressionAttributeNames[`#${name}`] = name;
      this.expr.ExpressionAttributeValues[`:${name}`] = value;
      this.expr.FilterExpression += `begins_with(#${name}, :${name})`;
    }

    return this;
  }

  private contains(s: Separator, name: string, value: Value, key?: string) {
    this._appendSeparator(s);
    if (key) {
      this.expr.ExpressionAttributeValues[`:${name}`] = value;
      this.expr.FilterExpression += `contains(#${key}, :${name})`;
    } else {
      this.expr.ExpressionAttributeNames[`#${name}`] = name;
      this.expr.ExpressionAttributeValues[`:${name}`] = value;
      this.expr.FilterExpression += `contains(#${name}, :${name})`;
    }
    return this;
  }

  private combine(
    s: Separator,
    other: DynamoDBFilterExpression,
    wrap: boolean = false,
  ) {
    const o = other.output();
    if (o.FilterExpression && this.expr.FilterExpression) {
      this._appendSeparator(s);
    }
    if (o.FilterExpression) {
      if (wrap) {
        this.expr.FilterExpression += `(${o.FilterExpression})`;
      } else {
        this.expr.FilterExpression += `${o.FilterExpression}`;
      }
    }

    this.expr.ExpressionAttributeNames = {
      ...this.expr.ExpressionAttributeNames,
      ...o.ExpressionAttributeNames,
    };
    this.expr.ExpressionAttributeValues = {
      ...this.expr.ExpressionAttributeValues,
      ...o.ExpressionAttributeValues,
    };

    return this;
  }

  private operation(s: Separator): Operation {
    return {
      eq: (name, value, k) => this.eq(s, name, value, k),
      ne: (name, value, k) => this.ne(s, name, value, k),
      le: (name, value, k) => this.le(s, name, value, k),
      lt: (name, value, k) => this.lt(s, name, value, k),
      ge: (name, value, k) => this.ge(s, name, value, k),
      gt: (name, value, k) => this.gt(s, name, value, k),
      begins_with: (name, value, k) => this.begins_with(s, name, value, k),
      contains: (name, value, k) => this.contains(s, name, value, k),
      combine: (o, wrap) => this.combine(s, o, wrap),
    };
  }

  get and(): Operation {
    return this.operation(Separator.AND);
  }

  get or(): Operation {
    return this.operation(Separator.OR);
  }

  addFieldKey(key: string) {
    this.expr.ExpressionAttributeNames[`#${key}`] = key;
    return this;
  }

  output(): FilterExpr {
    return this.expr;
  }

  updateDynamoDBExpr(expr: DynamoDBBaseParams, separator: 'AND' | 'OR') {
    if (expr.FilterExpression) {
      expr.FilterExpression += ` ${separator} ${this.expr.FilterExpression}`;
    } else {
      expr.FilterExpression = this.expr.FilterExpression;
    }

    if (!expr.FilterExpression) expr.FilterExpression = undefined;

    expr.ExpressionAttributeNames = {
      ...expr.ExpressionAttributeNames,
      ...this.expr.ExpressionAttributeNames,
    };
    expr.ExpressionAttributeValues = {
      ...expr.ExpressionAttributeValues,
      ...this.expr.ExpressionAttributeValues,
    };
  }

  /**
   * Construct new version of params with FilterExpression
   */
  fromDynamoDBCommandInput(
    expr: DynamoDBBaseParams,
    separator: 'AND' | 'OR',
  ): DynamoDBBaseParams {
    let FilterExpression: string | undefined;

    if (expr.FilterExpression && this.expr.FilterExpression) {
      FilterExpression = `${expr.FilterExpression} ${separator} ${this.expr.FilterExpression}`;
    } else if (expr.FilterExpression && !this.expr.FilterExpression) {
      FilterExpression = expr.FilterExpression;
    } else if (!expr.FilterExpression && this.expr.FilterExpression) {
      FilterExpression = this.expr.FilterExpression;
    } else {
      FilterExpression = undefined;
    }

    return {
      ...expr,
      FilterExpression,
      ExpressionAttributeNames: {
        ...expr.ExpressionAttributeNames,
        ...this.expr.ExpressionAttributeNames,
      },
      ExpressionAttributeValues: {
        ...expr.ExpressionAttributeValues,
        ...this.expr.ExpressionAttributeValues,
      },
    };
  }
}
