import BasicColumn, { newBasicColumn } from '../types/BasicColumn';
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

  public displayedColumns(): Array<BasicColumn> {
    return [...this.columns[0].keys()].map((i) => this.displayedColumnAt(i));
  }

  public displayedColumnAt(index: number): BasicColumn {
    const prefTableIndex = this.rPriority[index] ? 1 : 0;
    let primaryCol: Column;
    const prefCol = this.columns[prefTableIndex][index];
    const altCol = this.columns[1 - prefTableIndex][index];
    if (prefCol != null) primaryCol = prefCol;
    else if (altCol != null) primaryCol = altCol;
    else throw new Error('Two null columns got matched inside a UnionedTable');
    return newBasicColumn(
      primaryCol.name,
      primaryCol.dataType,
      !prefCol || prefCol.nullable || !altCol || altCol.nullable
    );
  }
}
