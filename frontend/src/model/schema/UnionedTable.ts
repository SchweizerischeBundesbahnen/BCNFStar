import BasicTable from './BasicTable';
import Column from './Column';
import Table from './Table';

export default class UnionedTable extends BasicTable {
  public tables: [Table, Table];
  public columns: [Array<Column | null>, Array<Column | null>];
  /** states for each column whether columns from table1 (false) or table2 (true) should be prioritized. */
  public rPriority = new Array<boolean>();

  public constructor(
    table1: Table,
    cols1: Array<Column | null>,
    table2: Table,
    cols2: Array<Column | null>
  ) {
    super();
    this.tables = [table1, table2];
    this.columns = [cols1, cols2];
  }

  public displayedColumns(): Array<Column> {
    return this.columns[0].map((col, i) => {
      const prefIndex = this.rPriority ? 1 : 0;
      if (this.columns[prefIndex][i] != null) return this.columns[prefIndex][i];
      if (this.columns[1 - prefIndex][i] != null)
        return this.columns[1 - prefIndex][i];
      throw Error;
    }) as Array<Column>;
  }
}
