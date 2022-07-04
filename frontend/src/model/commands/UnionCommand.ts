import Column from '../schema/Column';
import Schema from '../schema/Schema';
import Table from '../schema/Table';
import UnionedTable from '../schema/UnionedTable';
import Command from './Command';

export default class UnionCommand extends Command {
  public newTable?: UnionedTable;

  public constructor(
    private schema: Schema,
    public tables: Array<Table>,
    private columns: Array<Array<Column | null>>,
    private newTableName?: string
  ) {
    super();
  }

  protected override _do(): void {
    this.newTable = new UnionedTable(
      this.tables[0],
      this.columns[0],
      this.tables[1],
      this.columns[1]
    );
    this.newTable.schemaName = this.tables[0].schemaName;
    this.newTable.name = this.newTableName || this.tables[0].name;
    this._redo();
  }

  protected override _undo(): void {
    this.schema.deleteTables(this.newTable!);
    this.schema.addTables(...this.tables);
  }

  protected override _redo(): void {
    this.schema.deleteTables(...this.tables);
    this.schema.addTables(this.newTable!);
  }
}
