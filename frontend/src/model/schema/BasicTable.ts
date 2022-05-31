import Column from './Column';
import ColumnCombination from './ColumnCombination';
import SourceColumn from './SourceColumn';
import TableRelationship from './TableRelationship';

export default abstract class BasicTable {
  public name = '';
  public schemaName = '';

  /**
   * cached results of schema.fksOf(this). Should not be accessed from outside the schema class
   */
  public _fks!: Array<TableRelationship>;
  /**
   * cached results of schema.fksOf(this). Should not be accessed from outside the schema class
   */
  public _references!: Array<TableRelationship>;

  public abstract isKey(columns: ColumnCombination): boolean;

  /**
   * @returns all sets of columns - each set coming mostly from the same SourceTableInstance - which match the sourceColumns.
   * Columns from other SourceTableInstances can be included in one match, if the columns have the same values as the
   * equivalent column from the same SourceTableInstance would have.
   * @param sourceColumns columns to be matched. Must come from the same SourceTable
   * @param allowReduced do we want matches which come from reduced sources (see reducedSources)
   */
  public abstract columnsEquivalentTo(
    sourceColumns: Array<SourceColumn>,
    allowReduced: boolean
  ): Array<Array<Column>>;
}
