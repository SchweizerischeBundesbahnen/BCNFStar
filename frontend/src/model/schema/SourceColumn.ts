import SourceTable from './SourceTable';

/**
 * Represents a column that exists in the database.
 */
export default class SourceColumn {
  public constructor(
    public name: string,
    public table: SourceTable,
    public dataType: string,
    public ordinalPosition: number,
    public nullable: boolean
  ) {}

  public equals(other: SourceColumn): boolean {
    if (this == other) return true;
    return this.name == other.name && this.table.equals(other.table);
  }
}
