import Column from '../Column';
import ColumnCombination from '../ColumnCombination';
import FunctionalDependency from '../FunctionalDependency';
import Relationship from '../Relationship';
import Table from '../Table';
import Delete from './Delete';

/** Method object for performing a split operation on a table with a functional dependency. */
export default class Split {
  public newTables!: [Table, Table];

  public constructor(
    private table: Table,
    private fd: FunctionalDependency,
    private generatingName?: string
  ) {
    this.split();
  }

  private split() {
    let remaining: Table = new Delete(
      this.table,
      this.fd.rhs.copy().setMinus(this.fd.lhs)
    ).newTable;
    let generating: Table = new Delete(
      this.table,
      this.table.columns.copy().setMinus(this.fd.rhs)
    ).newTable;
    generating.surrogateKey = '';
    generating.pk =
      this.fd.lhs.cardinality > 0 ? this.fd.lhs.copy() : undefined;
    this.reorderColumnsOf(generating);
    generating.name =
      this.generatingName ||
      this.fd.lhs.columnNames().join('_').substring(0, 50);
    generating.isSuggestedFact = false;
    generating.isRejectedFact = false;

    this.substitute(generating, this.fd.lhs);

    this.newTables = [remaining, generating];
  }

  /** Substitute each of the given columns of the table with a copy. */
  private substitute(table: Table, columns: ColumnCombination) {
    const mapping = new Map<Column, Column>();
    for (const column of columns) {
      mapping.set(column, column.copy());
    }

    table.columns.columnSubstitution(mapping);
    table.pk?.columnSubstitution(mapping);
    table.relationships = table.relationships.map((relationship) => {
      return new Relationship(
        relationship.referencing.map((column) => mapping.get(column) || column),
        relationship.referenced.map((column) => mapping.get(column) || column)
      );
    });
    table.fds.forEach((fd) => {
      fd.lhs.columnSubstitution(mapping);
      fd.rhs.columnSubstitution(mapping);
    });
  }

  /** Puts primary key columns first. */
  private reorderColumnsOf(table: Table) {
    if (!table.pk) return;
    const columns = table.columns;
    table.columns = new ColumnCombination();
    for (const pkCol of table.pk!) table.columns.add(pkCol);
    for (const col of columns) table.columns.add(col);
  }
}
