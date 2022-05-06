export default class SourceTable {
  public constructor(public name: string, public schemaName: string) {}

  public toJSON() {
    return {
      name: this.name,
      schemaName: this.schemaName,
    };
  }

  /**
   * returns the name of the table in the format "{schemaName}.{tableName}"
   */
  public get fullName(): string {
    return this.schemaName + '.' + this.name;
  }

  public equals(other: SourceTable) {
    if (this == other) return true;
    return this.name == other.name && this.schemaName == other.schemaName;
  }
}
