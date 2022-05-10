import IFunctionalDependency from '@server/definitions/IFunctionalDependency';
import ColumnCombination from './ColumnCombination';
import Table from './Table';

export default class FunctionalDependency {
  lhs: ColumnCombination;
  rhs: ColumnCombination;
  /**
   * cached result of the score calculation. Should not be accessed directly
   */
  public _score?: number;

  public constructor(lhs: ColumnCombination, rhs: ColumnCombination) {
    this.lhs = lhs;
    this.rhs = rhs;
    this.extend();
  }

  public static fromIFunctionalDependency(
    table: Table,
    iFd: IFunctionalDependency
  ): FunctionalDependency {
    const lhs = table.columns.columnsFromNames(...iFd.lhsColumns);
    const rhs = table.columns.columnsFromNames(...iFd.rhsColumns);

    return new FunctionalDependency(lhs, rhs);
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
