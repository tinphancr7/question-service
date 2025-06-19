export class DynamoDBPath {
  private path: string;
  constructor() {
    this.path = '';
  }

  /**
   * join `path` if `value` is `truthy`
   *
   * if `force` is true, it will join even `value` is `falsy`
   */
  join(key: string, value?: string, force: boolean = false) {
    if (force === false && !value) return this;
    if (this.path.length < 1) this.path = [key, value].join('#');
    else this.path = [this.path, key, value].join('#');
    return this;
  }

  get data() {
    return this.path;
  }
}
