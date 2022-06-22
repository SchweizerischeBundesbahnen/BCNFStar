import Schema from '../schema/Schema';
import Table from '../schema/Table';
import Command from './Command';

export default class SuggestFactCommand extends Command {
  public constructor(private schema: Schema, public table: Table) {
    super();
  }

  protected override _do(): void {
    this.schema.suggestFactTable(this.table);
  }

  protected override _undo(): void {
    this.schema.unsuggestFactTable(this.table);
  }

  protected override _redo(): void {
    this._do();
  }
}
