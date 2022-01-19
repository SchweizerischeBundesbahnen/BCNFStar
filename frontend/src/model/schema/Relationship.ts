import ColumnCombination from './ColumnCombination';
import Table from './Table';

export default class Relationship {
  public referencing: ColumnCombination;
  public referenced: ColumnCombination;

  public constructor(
    referencing: ColumnCombination,
    referenced: ColumnCombination
  ) {
    this.referencing = referencing;
    this.referenced = referenced;
  }

  public appliesTo(referencing: Table, referenced: Table) {
    return (
      this.referencing.isSubsetOf(referencing.columns) &&
      this.referenced.isSubsetOf(referenced.columns)
    );
  }
}
