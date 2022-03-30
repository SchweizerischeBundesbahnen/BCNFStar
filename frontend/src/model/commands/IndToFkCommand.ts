import Relationship from '../schema/Relationship';
import Schema from '../schema/Schema';
import Table from '../schema/Table';
import Command from './Command';

export default class IndToFkCommand extends Command {
  schema: Schema;
  relationship: Relationship;
  referencing: Table;
  referenced: Table;

  public constructor(
    schema: Schema,
    relationship: Relationship,
    referencing: Table,
    referenced: Table
  ) {
    super();
    this.schema = schema;
    this.relationship = relationship;
    this.referencing = referencing;
    this.referenced = referenced;
  }

  protected override _do(): void {
    this.schema.addFkRelationship(this.relationship);
  }

  protected override _undo(): void {
    this.schema.deleteFkRelationship(this.relationship);
  }

  protected override _redo(): void {
    this.schema.addFkRelationship(this.relationship);
  }
}
