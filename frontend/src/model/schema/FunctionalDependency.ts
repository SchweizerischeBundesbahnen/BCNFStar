import ColumnCombination from './ColumnCombination';
import Table from './Table';

export default class FunctionalDependency {
  lhs: ColumnCombination;
  rhs: ColumnCombination;
  /**
   * cached result of the score calculation. Should not be accessed directly
   */
  public _fdScore?: number;

  public constructor(lhs: ColumnCombination, rhs: ColumnCombination) {
    this.lhs = lhs;
    this.rhs = rhs;
    this.extend();
  }

  //  "[c_address] --> c_acctbal, c_comment, c_custkey, c_mktsegment, c_name, c_nationkey, c_phone"
  public static fromString(
    table: Table,
    metanomeString: string
  ): FunctionalDependency {
    const [lhsString, rhsString] = metanomeString
      .split('-->')
      .map((elem) => elem.trim());
    let rhs: ColumnCombination = table.columns.columnsFromNames(
      ...rhsString.split(',').map((elem) => elem.trim())
    );
    let lhs: ColumnCombination = table.columns.columnsFromNames(
      ...lhsString
        .replace('[', '')
        .replace(']', '')
        .split(',')
        .map((elem) => elem.trim())
    );

    return new FunctionalDependency(lhs, rhs);
  }

  private extend(): void {
    this.rhs.union(this.lhs);
    // TODO: Inter-FD-extension (maybe)
  }

  public isFullyTrivial(): boolean {
    return this.rhs.isSubsetOf(this.lhs);
  }

  public toString(): string {
    return `${this.lhs} -> ${this.rhs.copy().setMinus(this.lhs)}`;
  }
}
