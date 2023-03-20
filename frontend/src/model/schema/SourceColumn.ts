import SourceTable from './SourceTable';

/**
 * Represents a column that exists in the database.
 */
export default class SourceColumn {
  public constructor(
    public name: string,
    public table: SourceTable,
    public dataType: string,
    public schemaNullable: boolean,
    public inferredNullable?: boolean
  ) {}

  public equals(other: SourceColumn): boolean {
    if (this == other) return true;
    return this.name == other.name && this.table.equals(other.table);
  }

  /**
   * Use this instead of inferredNullable to avoid having errors because of missing database connection.
   */
  public get safeInferredNullable() {
    return this.inferredNullable ?? this.schemaNullable;
  }
}
