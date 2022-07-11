import Schema from '../schema/Schema';
import BasicTable from '../schema/BasicTable';
import Command from './Command';

export default class DeleteTableCommand extends Command {
  public constructor(private schema: Schema, public table: BasicTable) {
    super();
  }

  protected override _do(): void {
    this.schema.deleteTables(this.table);
  }

  protected override _undo(): void {
    this.schema.addTables(this.table);
  }

  protected override _redo(): void {
    this._do();
  }
}
