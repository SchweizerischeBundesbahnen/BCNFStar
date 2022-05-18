import Schema from '../schema/Schema';
import SourceRelationship from '../schema/SourceRelationship';
import Command from './Command';

export default class IndToFkCommand extends Command {
  public constructor(
    private schema: Schema,
    private relationship: SourceRelationship
  ) {
    super();
  }

  protected override _do(): void {
    this.schema.addFk(this.relationship);
  }

  protected override _undo(): void {
    this.schema.deleteFk(this.relationship);
  }

  protected override _redo(): void {
    this.schema.addFk(this.relationship);
  }
}
