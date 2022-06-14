import Column from './Column';
import ColumnCombination from './ColumnCombination';
import Relationship from './Relationship';
import Table from './Table';

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
    public referencing: Table,
    public referenced: Table
  ) {}

  public toString() {
    return `(${this.referencing.fullName}) ${new ColumnCombination(
      this.referencingCols
    )} -> (${this.referenced.fullName}) ${new ColumnCombination(
      this.referencedCols
    )}`;
  }

  public toJSON() {
    return {
      relationship: this.relationship,
      referencing: this.referencing.fullName,
      referenced: this.referenced.fullName,
    };
  }

  public equals(other: TableRelationship): boolean {
    if (this.referenced != other.referenced) return false;
    if (this.referencing != other.referencing) return false;
    return this.relationship.equals(other.relationship);
  }

  /**
    If this relationship is affected by a surrogate key,
    this is the name of the according surrogate column.
    This is also the name of the jointjs port to
    attach to for any foreign key.
   */
  get referencedName(): string {
    return this.referenced.implementsSurrogateKey()
      ? this.referenced.surrogateKey
      : this.referencedCols[0].name;
  }

  /**
    If this relationship is affected by a surrogate key,
    this is the name of the according surrogate column.
    This is also the name of the jointjs port to
    attach to for any foreign key.
    */
  get referencingName(): string {
    return this.referenced.implementsSurrogateKey()
      ? this.referenced.surrogateKey +
          '_' +
          this.referencingCols.map((col) => col.name).join('_')
      : this.referencingCols[0].name;
  }

  isConnected(other: TableRelationship): boolean {
    return (
      this.referenced == other.referencing &&
      new ColumnCombination(other.referencingCols).isSubsetOf(
        new ColumnCombination(this.referencedCols)
      )
    );
  }

  get referencingCols(): Array<Column> {
    return this.relationship.referencing;
  }

  get referencedCols(): Array<Column> {
    return this.relationship.referenced;
  }

  mapsColumns(col1: Column, col2: Column): boolean {
    return this.relationship.mapsColumns(col1, col2);
  }
}
