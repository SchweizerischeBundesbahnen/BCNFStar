import ColumnCombination from './ColumnCombination';

/**
 * This class represents a functional dependency inside a table.
 * The left hand side is always included in the right hand side.
 * _redundantTuples is the sum of all tuples which are redundant in the emerging table after splitting grouped by lhs
 * _uniqueTuplesLhs are the unique values of the emerging table after splitting grouped by lhs
 */
export default class FunctionalDependency {
  public lhs: ColumnCombination;
  public rhs: ColumnCombination;
  public _redundantTuples: number = 0;
  public _uniqueTuplesLhs: number = 0;

  /**
   * cached result of the score calculation. Should not be accessed directly
   */
  public _score?: number;

  public constructor(lhs: ColumnCombination, rhs: ColumnCombination) {
    this.lhs = lhs;
    this.rhs = rhs;
    this.rhs.union(this.lhs);
  }

  public copy(): FunctionalDependency {
    let newFd = new FunctionalDependency(this.lhs.copy(), this.rhs.copy());
    newFd._redundantTuples = this._redundantTuples;
    newFd._uniqueTuplesLhs = this._uniqueTuplesLhs;

    return newFd;
  }

  /**
   * Returns whether the rhs is a subset of the lhs.
   * Such a functional dependency is always valid and is therefore called "trivial".
   */
  public isTrivial(): boolean {
    return this.lhs.cardinality >= this.rhs.cardinality;
  }

  public toString(): string {
    return `${this.lhs} -> ${this.rhs.copy().setMinus(this.lhs)}`;
  }
}
