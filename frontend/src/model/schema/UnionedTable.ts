import BasicTable from './BasicTable';
import Column from './Column';
import ColumnCombination from './ColumnCombination';
import SourceColumn from './SourceColumn';

export default class UnionedTable extends BasicTable {
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
