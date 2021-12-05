import ColumnCombination from './ColumnCombination';
import Table from './Table';

export default class FunctionalDependency {
  table: Table;
  lhs: ColumnCombination;
  rhs: ColumnCombination;

  public constructor(
    table: Table,
    lhs: ColumnCombination,
    rhs: ColumnCombination
  ) {
    this.table = table;
    this.lhs = lhs;
    this.rhs = rhs;
  }

  //  "[c_address] --> c_acctbal, c_comment, c_custkey, c_mktsegment, c_name, c_nationkey, c_phone"
  public static fromString(
    table: Table,
    metanomeString: string
  ): FunctionalDependency {
    const [lhsString, rhsString] = metanomeString
      .split('-->')
      .map((elem) => elem.trim());
    // console.log("lhs: ", lhsString);
    // console.log("rhs: ", rhsString);
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

    return new FunctionalDependency(table, lhs, rhs);
  }

  public extend(): void {
    this.rhs.union(this.lhs);
    // TODO: Inter-FD-extension (maybe)
  }

  public isKey(): boolean {
    // assume fd is fully extended
    // TODO what about null values
    return this.rhs.equals(this.table.columns);
  }

  public isFullyTrivial(): boolean {
    return this.lhs.equals(this.rhs);
  }

  public violatesBCNF(): boolean {
    return !this.isKey();
  }

  public toString(): string {
    return `${this.lhs} -> ${this.rhs.copy().setMinus(this.lhs)}`;
  }
}
