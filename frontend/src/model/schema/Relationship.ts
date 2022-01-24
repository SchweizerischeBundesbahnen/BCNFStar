import Column from './Column';
import ColumnCombination from './ColumnCombination';
import Table from './Table';

export default class Relationship {
  private _referencing = new Array<Column>();
  private _referenced = new Array<Column>();

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
    return (
      this.referencing().isSubsetOf(referencing.columns) &&
      this.referenced().isSubsetOf(referenced.columns)
    );
  }

  public referencingToReferencedColumnsIn(cc: ColumnCombination) {
    for (let i = 0; i < this._referencing.length; i++) {
      if (cc.includes(this._referencing[i])) {
        cc.setMinus(new ColumnCombination(this._referencing[i])).union(
          new ColumnCombination(this._referenced[i])
        );
      }
    }
  }

  public referencedToReferencingColumnsIn(cc: ColumnCombination) {
    for (let i = 0; i < this._referenced.length; i++) {
      if (cc.includes(this._referenced[i])) {
        cc.setMinus(new ColumnCombination(this._referenced[i])).union(
          new ColumnCombination(this._referencing[i])
        );
      }
    }
  }

  public toString(): String {
    return this.referencing().toString() + '->' + this.referenced().toString();
  }
}