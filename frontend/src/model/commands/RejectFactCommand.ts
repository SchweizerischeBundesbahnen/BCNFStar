import BasicTable from '../schema/BasicTable';
import Schema from '../schema/Schema';
import Command from './Command';

export default class RejectFactCommand extends Command {
  public constructor(private schema: Schema, public table: BasicTable) {
    super();
  }

  protected override _do(): void {
    this.schema.rejectFact(this.table);
  }

  protected override _undo(): void {
    this.schema.unrejectFact(this.table);
  }

  protected override _redo(): void {
    this._do();
  }
}
