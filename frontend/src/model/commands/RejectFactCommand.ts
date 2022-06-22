import Schema from '../schema/Schema';
import Table from '../schema/Table';
import Command from './Command';

export default class RejectFactCommand extends Command {
  public constructor(private schema: Schema, public table: Table) {
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
