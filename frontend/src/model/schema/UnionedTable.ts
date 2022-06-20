import BasicTable from './BasicTable';
import Column from './Column';
import Table from './Table';

export default class UnionedTable extends BasicTable {
  public tables: Array<Table>;
  public columns = new Array<Array<Column | null>>();

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
      if (col != null) return col;
      if (this.columns[1][i] != null) return this.columns[1][i];
      throw Error;
    }) as Array<Column>;
  }
}
