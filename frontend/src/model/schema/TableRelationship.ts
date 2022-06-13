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

  /**
    If this relationship is affected by a surrogate key,
    this is the name of the according surrogate column.
    This is also the name of the jointjs port to
    attach to for any foreign key.
   */
  get referencedName(): string {
    return this.referenced.implementsSurrogateKey()
      ? this.referenced.surrogateKey
      : this.relationship.referenced[0].name;
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
          this.relationship.referencing.map((col) => col.name).join('_')
      : this.relationship.referencing[0].name;
  }
}
