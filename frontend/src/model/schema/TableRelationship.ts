import BasicTableRelationship from './BasicTableRelationship';
import Column from './Column';
import ColumnCombination from './ColumnCombination';
import Relationship from './Relationship';
import Table from './Table';

/**
 * These objects describe a foreign key relationship or inclusiondependency between two different tables.
 * It contains all information to uniquely identify all columns involved in the relationship across the schema.
 */
export default class TableRelationship implements BasicTableRelationship {
  /**
   * Note that the referencing columns are part of the referencing table and analagous for referenced.
   * Be careful when using the relationship without the context of the respective tables.
   */
  public constructor(
    public relationship: Relationship,
    public referencingTable: Table,
    public referencedTable: Table
  ) {}

  public toString() {
    return `(${this.referencingTable.fullName}) ${new ColumnCombination(
      this.referencingCols
    )} -> (${this.referencedTable.fullName}) ${new ColumnCombination(
      this.referencedCols
    )}`;
  }

  public toJSON() {
    return {
      relationship: this.relationship,
      referencing: this.referencingTable.fullName,
      referenced: this.referencedTable.fullName,
    };
  }

  public equals(other: TableRelationship): boolean {
    if (this.referencedTable != other.referencedTable) return false;
    if (this.referencingTable != other.referencingTable) return false;
    return this.relationship.equals(other.relationship);
  }

  /**
    If this relationship is affected by a surrogate key,
    this is the name of the according surrogate column.
    This is also the name of the jointjs port to
    attach to for any foreign key.
   */
  get referencedName(): string {
    return this.referencedTable.implementsSurrogateKey()
      ? this.referencedTable.surrogateKey
      : this.referencedCols[0].name;
  }

  /**
    If this relationship is affected by a surrogate key,
    this is the name of the according surrogate foreign key column.
    This is also the name of the jointjs port to
    attach to for any foreign key.
    */
  get referencingName(): string {
    return this.referencedTable.implementsSurrogateKey()
      ? this.referencedTable.surrogateKey +
          '_' +
          this.referencingCols.map((col) => col.name).join('_')
      : this.referencingCols[0].name;
  }

  /**
   * whether @other can be transitively extended by composing this relationship with @other
   */
  public isConnected(other: TableRelationship): boolean {
    return (
      this.referencedTable == other.referencingTable &&
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

  public mapsColumns(col1: Column, col2: Column): boolean {
    return this.relationship.mapsColumns(col1, col2);
  }
}
