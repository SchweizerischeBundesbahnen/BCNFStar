import IRelationship from '@server/definitions/IRelationship';
import Column from './Column';
import SourceRelationship from './SourceRelationship';
import SourceTableInstance from './SourceTableInstance';

/**
 * This class is used for the representation of foreign keys that are used inside a table to join two sourceTableInstances.
 * The arrays referencing and referenced are linked in a way so that the columns with the same index are corresponding.
 */
export default class Relationship {
  private _referencing: Array<Column>;
  private _referenced: Array<Column>;

  /** cached result of the score calculation. Should not be accessed directly */
  public _score?: number;

  public constructor(referencing: Array<Column>, referenced: Array<Column>) {
    this._referencing = referencing;
    this._referenced = referenced;
  }

  public get referencing(): Array<Column> {
    return Array.from(this._referencing);
  }

  public set referencing(value: Array<Column>) {
    this._referencing = value;
  }

  public get referenced(): Array<Column> {
    return Array.from(this._referenced);
  }

  public set referenced(value: Array<Column>) {
    this._referenced = value;
  }

  public add(referencing: Column, referenced: Column) {
    this._referencing.push(referencing);
    this._referenced.push(referenced);
  }

  public removeByIndex(index: number) {
    this._referencing.splice(index, 1);
    this._referenced.splice(index, 1);
  }

  /**
   * Returns the sourceRelationship which this relationship originated from.
   */
  public sourceRelationship(): SourceRelationship {
    const sourceRel = new SourceRelationship();
    for (const i in this._referencing) {
      sourceRel.referencingCols.push(this._referencing[i].sourceColumn);
      sourceRel.referencedCols.push(this._referenced[i].sourceColumn);
    }
    return sourceRel;
  }

  /**
   * Returns a copy of this relationship where all sourceTableInstances of the columns in this relationship are replaced according to the mapping.
   */
  public applySourceMapping(
    mapping: Map<SourceTableInstance, SourceTableInstance>
  ): Relationship {
    return new Relationship(
      this.referencing.map((column) => column.applySourceMapping(mapping)),
      this.referenced.map((column) => column.applySourceMapping(mapping))
    );
  }

  /**
   * Returns the columns that are referenced in this relationship by the passed columns (referencing).
   */
  public columnsReferencedBy(
    referencing: Array<Column>
  ): Array<Column | undefined> {
    return referencing
      .map((col) => this._referencing.indexOf(col))
      .map((index) => (index != -1 ? this._referenced[index] : undefined));
  }

  public toString(): string {
    return this.referencing.toString() + '->' + this.referenced.toString();
  }

  public toIRelationship(): IRelationship {
    return {
      referencing: {
        name: this.referencing[0].sourceTableInstance.table.name,
        schemaName: this.referencing[0].sourceTableInstance.table.schemaName,
        attributes: [],
      },
      referenced: {
        name: this.referenced[0].sourceTableInstance.table.name,
        schemaName: this.referenced[0].sourceTableInstance.table.schemaName,
        attributes: [],
      },
      columnRelationships: this._referencing.map((referencingCol, index) => {
        return {
          referencingColumn: referencingCol.name,
          referencedColumn: this._referenced[index].name,
        };
      }),
    };
  }

  public equals(other: Relationship): boolean {
    if (this == other) return true;
    if (
      !this.referencing[0].sourceTableInstance.table.equals(
        other.referencing[0].sourceTableInstance.table
      )
    )
      return false;
    if (
      !this.referenced[0].sourceTableInstance.table.equals(
        other.referenced[0].sourceTableInstance.table
      )
    )
      return false;
    if (this.referencing.length != other.referencing.length) return false;

    const pairs = this.referencing
      .map(
        (column, index) =>
          `${column.identifier}.${this.referenced[index].identifier}`
      )
      .sort();
    const otherPairs = other.referencing
      .map(
        (column, index) =>
          `${column.identifier}.${other.referenced[index].identifier}`
      )
      .sort();
    return pairs.every((pair, index) => pair == otherPairs[index]);
  }

  /**
   * Returns whether the column referencingCol is referencing the column referencedCol in this relationship.
   */
  public mapsColumns(referencingCol: Column, referencedCol: Column): boolean {
    const i = this.referencing.findIndex((otherReferencingCol) =>
      otherReferencingCol.equals(referencingCol)
    );
    if (i == -1) return false;
    return this.referenced[i].equals(referencedCol);
  }
}
