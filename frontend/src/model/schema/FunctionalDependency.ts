import ColumnCombination from './ColumnCombination';

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
    this.extend();
  }

  public copy(): FunctionalDependency {
    let newFd = new FunctionalDependency(this.lhs.copy(), this.rhs.copy());
    newFd._redundantTuples = this._redundantTuples;
    newFd._uniqueTuplesLhs = this._uniqueTuplesLhs;

    return newFd;
  }

  private extend(): void {
    this.rhs.union(this.lhs);
    // TODO: Inter-FD-extension (maybe)
  }

  public isFullyTrivial(): boolean {
    return this.lhs.cardinality >= this.rhs.cardinality;
  }

  public toString(): string {
    return `${this.lhs} -> ${this.rhs.copy().setMinus(this.lhs)}`;
  }
}
