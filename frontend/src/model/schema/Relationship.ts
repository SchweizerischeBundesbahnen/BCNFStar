import IRelationship from '@server/definitions/IRelationship';
import Column from './Column';
import SourceRelationship from './SourceRelationship';

export default class Relationship {
  // these arrays are linked, the column in _referencing has the same index as the
  // corresponding column in _referenced
  private _referencing: Array<Column>;
  private _referenced: Array<Column>;

  /**
   * cached result of the score calculation. Should not be accessed directly
   */
  public _score?: number;

  public constructor(referencing: Array<Column>, referenced: Array<Column>) {
    this._referencing = referencing;
    this._referenced = referenced;
  }

  public get referencing(): Array<Column> {
    return Array.from(this._referencing);
  }

  public get referenced(): Array<Column> {
    return Array.from(this._referenced);
  }

  public sourceRelationship(): SourceRelationship {
    const sourceRel = new SourceRelationship();
    for (const i in this._referencing) {
      sourceRel.referencing.push(this._referencing[i].sourceColumn);
      sourceRel.referenced.push(this._referenced[i].sourceColumn);
    }
    return sourceRel;
  }

  public toString(): String {
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
      columnRelationships: this._referencing.map((element, index) => {
        return {
          referencingColumn: element.name,
          referencedColumn: this._referenced[index].name,
        };
      }),
    };
  }
}
