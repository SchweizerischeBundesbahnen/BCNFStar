import BasicTable from './BasicTable';
import Column from './Column';
import ColumnCombination from './ColumnCombination';
import SourceColumn from './SourceColumn';
import Table from './Table';

export default class UnionedTable extends BasicTable {
  public tables: Array<Table>;
  public columns = new Map<Table, Array<Column>>();

  public constructor(
    table1: Table,
    cols1: Array<Column>,
    table2: Table,
    cols2: Array<Column>
  ) {
    super();
    this.tables = [table1, table2];
    this.columns.set(table1, cols1);
    this.columns.set(table2, cols2);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public isKey(columns: ColumnCombination): boolean {
    return false;
  }

  public columnsEquivalentTo(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sourceColumns: Array<SourceColumn>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    allowReduced: boolean
  ): Array<Array<Column>> {
    return [];
  }
}
