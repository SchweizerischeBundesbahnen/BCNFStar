import BasicTable from './BasicTable';
import ColumnCombination from './ColumnCombination';
import Relationship from './Relationship';

/**
 * These objects describe a relationship between two different tables.
 * It contains all information to uniquely identify all columns involved in the relationship across the schema.
 */
export default class TableRelationship {
  /**
   * Note that the referencing columns are part of the referencing table and analagous for referenced.
   * Be careful when using the relationship without the context of the respective tables.
   */
  public constructor(
    public relationship: Relationship,
    public referencing: BasicTable,
    public referenced: BasicTable
  ) {}

  public toString() {
    return `(${this.referencing.name}) ${new ColumnCombination(
      this.relationship.referencing
    )} -> (${this.referenced.name}) ${new ColumnCombination(
      this.relationship.referenced
    )}`;
  }

  public equals(other: TableRelationship): boolean {
    if (this.referenced != other.referenced) return false;
    if (this.referencing != other.referencing) return false;
    return this.relationship.equals(other.relationship);
  }
}
