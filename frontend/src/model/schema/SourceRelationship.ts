import SourceColumn from './SourceColumn';

/**
 * Represents a foreign key relationship or inclusion dependency inside the database.
 * The arrays referencingCols and referencedCols are linked in a way so that the columns with the same index are corresponding.
 */
export default class SourceRelationship {
  public constructor(
    private _referencingCols = new Array<SourceColumn>(),
    private _referencedCols = new Array<SourceColumn>()
  ) {}

  public equals(other: SourceRelationship): boolean {
    if (this == other) return true;
    if (!this.referencingCols[0].table.equals(other.referencingCols[0].table))
      return false;
    if (!this.referencedCols[0].table.equals(other.referencedCols[0].table))
      return false;
    if (this.referencingCols.length != other.referencingCols.length)
      return false;

    const pairs = this.referencingCols
      .map(
        (column, index) => `${column.name}.${this.referencedCols[index].name}`
      )
      .sort();
    const otherPairs = other.referencingCols
      .map(
        (column, index) => `${column.name}.${other.referencedCols[index].name}`
      )
      .sort();
    return pairs.every((pair, index) => pair == otherPairs[index]);
  }

  /**
   * Returns whether the column referencingCol is referencing the column referencedCol in this relationship.
   */
  public mapsColumns(
    referencingCol: SourceColumn,
    referencedCol: SourceColumn
  ): boolean {
    const i = this.referencingCols.findIndex((otherReferencingCol) =>
      otherReferencingCol.equals(referencingCol)
    );
    if (i == -1) return false;
    return this.referencedCols[i].equals(referencedCol);
  }

  public get isTrivial(): boolean {
    for (const i in this.referencingCols) {
      if (!this.referencingCols[i].equals(this.referencedCols[i])) return false;
    }
    return true;
  }

  public toString(): string {
    const lhsString = this.referencingCols.map((col) => col.name).join(', ');
    const rhsString = this.referencedCols.map((col) => col.name).join(', ');

    const lhsSourceTable = this.referencingCols[0].table.fullName;
    const rhsSourceTable = this.referencedCols[0].table.fullName;

    return `(${lhsSourceTable}) ${lhsString} -> (${rhsSourceTable}) ${rhsString}`;
  }

  /**
   * Returns whether @other can be transitively extended by composing this relationship with @other
   */
  public isConnected(other: SourceRelationship): boolean {
    return other.referencingCols.every((otherCol) =>
      this.referencedCols.some((col) => col.equals(otherCol))
    );
  }

  public get referencingCols(): Array<SourceColumn> {
    return this._referencingCols;
  }

  public get referencedCols(): Array<SourceColumn> {
    return this._referencedCols;
  }
}
