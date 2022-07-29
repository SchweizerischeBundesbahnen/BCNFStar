import IFunctionalDependency from '@server/definitions/IFunctionalDependency';
import ColumnCombination from './ColumnCombination';
import Table from './Table';

/**
 * This class represents a functional dependency inside a table.
 * The left hand side is always included in the right hand side.
 */
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
    this.rhs.union(this.lhs);
  }

  public static fromIFunctionalDependency(
    table: Table,
    iFd: IFunctionalDependency
  ): FunctionalDependency {
    const lhs = table.columns.columnsByNames(...iFd.lhsColumns);
    const rhs = table.columns.columnsByNames(...iFd.rhsColumns);

    return new FunctionalDependency(
      new ColumnCombination(lhs),
      new ColumnCombination(rhs)
    );
  }

  public copy(): FunctionalDependency {
    return new FunctionalDependency(this.lhs.copy(), this.rhs.copy());
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
