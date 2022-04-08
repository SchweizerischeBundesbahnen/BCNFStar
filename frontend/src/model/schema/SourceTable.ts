export default class SourceTable {
  public constructor(public name: string, public schemaName: string) {}

  /**
   * returns the name of the table in the format "{schemaName}.{tableName}"
   */
  public get fullName(): string {
    return this.schemaName + '.' + this.name;
  }
}
