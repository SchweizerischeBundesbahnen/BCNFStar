import BasicTable from '../schema/BasicTable';
import Schema from '../schema/Schema';
import Command from './Command';

export default class SuggestFactCommand extends Command {
  public constructor(private schema: Schema, public table: BasicTable) {
    super();
  }

  protected override _do(): void {
    this.schema.suggestFact(this.table);
  }

  protected override _undo(): void {
    this.schema.unsuggestFact(this.table);
  }

  protected override _redo(): void {
    this._do();
  }
}
