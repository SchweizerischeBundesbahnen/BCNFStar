import SourceTable from './SourceTable';

export default class SourceColumn {
  public constructor(
    public name: string,
    public table: SourceTable,
    public dataType: string,
    public ordinalPosition: number,
    public nullable: boolean
  ) {}

  public toJSON() {
    return {
      name: this.name,
      table: this.table,
      dataType: this.dataType,
      ordinalPosition: this.ordinalPosition,
      nullable: this.nullable,
    };
  }

  public equals(other: SourceColumn): boolean {
    if (this == other) return true;
    return this.name == other.name && this.table.equals(other.table);
  }
}
