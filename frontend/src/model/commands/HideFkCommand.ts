import Schema from '../schema/Schema';
import TableRelationship from '../schema/TableRelationship';
import Command from './Command';

export default class HideFkCommand extends Command {
  public constructor(private schema: Schema, private fk: TableRelationship) {
    super();
  }

  protected override _do(): void {
    this.schema.addFkToBlacklist(this.fk);
  }

  protected override _undo(): void {
    this.schema.deleteFkFromBlacklist(this.fk);
  }

  protected override _redo(): void {
    this.schema.addFkToBlacklist(this.fk);
  }
}
