import Column from '../schema/Column';
import ColumnCombination from '../schema/ColumnCombination';
import Delete from '../schema/methodObjects/Delete';
import Schema from '../schema/Schema';
import Table from '../schema/Table';
import Command from './Command';

export default class DeleteColumnCommand extends Command {
  public newTable?: Table;

  public constructor(
    private schema: Schema,
    public table: Table,
    private column: Column
  ) {
    super();
  }

  protected override _do(): void {
    this.newTable = new Delete(
      this.table,
      new ColumnCombination([this.column])
    ).newTable;
    this._redo();
  }

  protected override _undo(): void {
    this.schema.deleteTables(this.newTable!);
    this.schema.addTables(this.table);
  }

  protected override _redo(): void {
    this.schema.deleteTables(this.table);
    this.schema.addTables(this.newTable!);
  }
}
