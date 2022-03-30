import IRelationship from '@server/definitions/IRelationship';
import Column from './Column';
import ColumnCombination from './ColumnCombination';
import Table from './Table';

export default class Relationship {
  // these arrays are linked, the column in _referencing has the same index as the
  // corresponding column in _referenced
  public _referencing = new Array<Column>();
  public _referenced = new Array<Column>();

  /**
   * cached result of the score calculation. Should not be accessed directly
   */
  public _score?: number;

  public static fromTables(
    referencing: Table,
    referenced: Table
  ): Relationship {
    // TODO optimise
    let relationship = new Relationship();
    referencing.columns.asSet().forEach((referencingColumn) => {
      let correspondingCols = referenced.columns
        .asArray()
        .filter((column) => column.equals(referencingColumn));
      if (correspondingCols.length > 0)
        relationship.add(referencingColumn, correspondingCols[0]);
    });
    return relationship;
  }

  public add(referencingColumn: Column, referencedColumn: Column) {
    this._referencing.push(referencingColumn);
    this._referenced.push(referencedColumn);
  }

  public referencing(): ColumnCombination {
    return new ColumnCombination(...this._referencing);
  }

  public referenced(): ColumnCombination {
    return new ColumnCombination(...this._referenced);
  }

  public appliesTo(referencing: Table, referenced: Table) {
    if (this.referencing().equals(this.referenced())) {
      return (
        this.referencing().isSubsetOf(referencing.columns) &&
        referenced.pk &&
        this.referenced().equals(referenced.pk!)
      );
    } else {
      return (
        this.referencing().isSubsetOf(referencing.columns) &&
        this.referenced().isSubsetOf(referenced.columns)
      );
    }
  }

  public referencingToReferencedColumnsIn(cc: ColumnCombination) {
    let newCC = cc.copy();
    for (let i = 0; i < this._referencing.length; i++) {
      if (newCC.includes(this._referencing[i])) {
        newCC
          .setMinus(new ColumnCombination(this._referencing[i]))
          .union(new ColumnCombination(this._referenced[i]));
      }
    }
    return newCC;
  }

  public toString(): String {
    return this.referencing().toString() + '->' + this.referenced().toString();
  }

  public toIRelationship(): IRelationship {
    return {
      referencing: {
        name: `${this.referencing().sourceTable().name}`,
        schemaName: `${this.referencing().sourceTable().schemaName!}`,
        attributes: [],
      },
      referenced: {
        name: `${this.referenced().sourceTable().name}`,
        schemaName: `${this.referenced().sourceTable().schemaName!}`,
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
