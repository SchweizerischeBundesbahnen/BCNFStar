import ColumnCombination from './ColumnCombination';

export default class FunctionalDependency {
  public lhs: ColumnCombination;
  public rhs: ColumnCombination;
  public redundantTuples: number;
  public allTuples: number;

  /**
   * cached result of the score calculation. Should not be accessed directly
   */
  public _score?: number;

  public constructor(
    lhs: ColumnCombination,
    rhs: ColumnCombination,
    redundantTuples: number,
    allTuples: number
  ) {
    this.lhs = lhs;
    this.rhs = rhs;
    this.redundantTuples = redundantTuples;
    this.allTuples = allTuples;
    this.extend();
  }

  public copy(): FunctionalDependency {
    return new FunctionalDependency(
      this.lhs.copy(),
      this.rhs.copy(),
      this.redundantTuples,
      this.allTuples
    );
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
