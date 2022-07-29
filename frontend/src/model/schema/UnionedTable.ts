import BasicColumn, { newBasicColumn } from '../types/BasicColumn';
import BasicTable from './BasicTable';
import BasicTableRelationship from './BasicTableRelationship';
import Column from './Column';
import Table from './Table';
import TableRelationship from './TableRelationship';

/**
 * A table which is the result of a UNION operation. It contains the two tables which are unioned and the matching of the columns.
 */
export default class UnionedTable extends BasicTable {
  public tables: [Table, Table];
  /**
   * Columns[i] contains the selected columns of tables[i].
   * The arrays are linked in a way so that the columns with the same index are unioned.
   */
  public columns: [Array<Column | null>, Array<Column | null>];
  /** States for each column whether columns from table1 (false) or table2 (true) should be prioritized. */
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

  public matchedColumn(column: Column) {
    const i = this.columns[0].indexOf(column);
    return this.columns[1][i];
  }

  public equivalentFk(
    fk1: TableRelationship,
    fk2: TableRelationship
  ): BasicTableRelationship | undefined {
    if (fk1.referencedTable != fk2.referencedTable) return undefined;
    if (fk1.referencingCols.length != fk2.referencingCols.length)
      return undefined;
    for (const i in fk1.referencingCols) {
      const referencingCol2 = this.matchedColumn(fk1.referencingCols[i]);
      if (!referencingCol2) return undefined;
      const referencedCol2 = fk2.relationship.columnsReferencedBy([
        referencingCol2,
      ])[0];
      if (!referencedCol2) return undefined;
      if (fk1.referencedCols[i] != referencedCol2) return undefined;
    }
    const newReferencingCols = fk1.referencingCols.map((col) =>
      this.displayedColumnAt(this.columns[0].indexOf(col))
    );
    return {
      referencingTable: this,
      referencingCols: newReferencingCols,
      referencingName: newReferencingCols[0].name,

      referencedTable: fk1.referencedTable,
      referencedCols: fk1.referencedCols,
      referencedName: fk1.referencedName,
    };
  }
}
