import SourceTable from './SourceTable';

export default class SourceColumn {
  public constructor(
    public name: string,
    public table: SourceTable,
    public dataType: string,
    public nullable: boolean
  ) {}

  public equals(other: SourceColumn): boolean {
    if (this == other) return true;
    return this.name == other.name && this.table.equals(other.table);
  }
}
