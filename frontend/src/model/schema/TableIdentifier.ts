export default class TableIdentifier {
  public name: string;
  public schemaName: string;

  public constructor(name: string, schemaName: string) {
    this.name = name;
    this.schemaName = schemaName;
  }

  public schemaAndName(): string {
    return this.schemaName + '.' + this.name;
  }
}
