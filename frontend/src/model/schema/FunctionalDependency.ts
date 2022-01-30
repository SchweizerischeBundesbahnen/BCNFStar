import ColumnCombination from './ColumnCombination';
import Table from './Table';

export default class FunctionalDependency {
  table: Table;
  lhs: ColumnCombination;
  rhs: ColumnCombination;
  private _fdScore?: number;

  public constructor(
    table: Table,
    lhs: ColumnCombination,
    rhs: ColumnCombination
  ) {
    this.table = table;
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

  private extend(): void {
    this.rhs.union(this.lhs);
    // TODO: Inter-FD-extension (maybe)
  }

  public isKey(): boolean {
    // assume fd is fully extended
    // TODO what about null values
    return this.rhs.equals(this.table.columns);
  }

  public isFullyTrivial(): boolean {
    return this.rhs.isSubsetOf(this.lhs);
  }

  public violatesBCNF(): boolean {
    if (this.isKey()) return false;
    if (this.lhs.cardinality == 0) return false;
    if (
      this.table.pk &&
      !this.table.pk.isSubsetOf(this.table.remainingSchema(this))
    )
      return false;
    if (
      this.table.fks().some((fk) => {
        return (
          !fk.relationship
            .referencing()
            .isSubsetOf(this.table.remainingSchema(this)) &&
          !fk.relationship
            .referencing()
            .isSubsetOf(this.table.generatingSchema(this))
        );
      })
    )
      return false;
    return true;
  }

  public toString(): string {
    return `${this.lhs} -> ${this.rhs.copy().setMinus(this.lhs)}`;
  }

  public fdScore(): number {
    //TODO: change score for fds with NULL values
    if (!this._fdScore) {
      this._fdScore =
        (this.fdLengthScore() +
          this.keyValueScore() +
          this.fdPositionScore() +
          this.fdDensityScore()) /
        4;
    }
    return this._fdScore;
  }

  private lhsLengthScore(): number {
    return this.lhs.cardinality > 0 ? 1 / this.lhs.cardinality : 0;
  }

  private rhsLengthScore(): number {
    //TODO: Find out the reason for the magic number 2
    return this.table.numColumns > 2
      ? this.rhs.copy().setMinus(this.lhs).cardinality /
          (this.table.numColumns - 2)
      : 0;
  }

  private fdLengthScore(): number {
    return (this.lhsLengthScore() + this.rhsLengthScore()) / 2;
  }

  private keyValueScore(): number {
    //TODO
    return 0;
  }

  public fdPositionScore(): number {
    return (this.lhsPositionScore() + this.rhsPositionScore()) / 2;
  }

  private lhsPositionScore(): number {
    return this.coherenceScore(this.lhs);
  }

  private rhsPositionScore(): number {
    return this.coherenceScore(this.rhs);
  }

  private coherenceScore(attributes: ColumnCombination): number {
    return 1 / (this.numAttributesBetween(attributes) + 1);
  }

  public numAttributesBetween(attributes: ColumnCombination): number {
    let firstColumn = attributes.inOrder()[0];
    let lastColumn = attributes.inOrder()[attributes.cardinality - 1];
    let range = lastColumn.prio - firstColumn.prio + 1;
    return range - attributes.cardinality;
  }

  public fdDensityScore(): number {
    //TODO
    return 0;
  }
}
