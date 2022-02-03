import ColumnCombination from '../schema/ColumnCombination';
import Relationship from '../schema/Relationship';
import Schema from '../schema/Schema';
import Table from '../schema/Table';
import Command from './Command';

export default class IndToFkCommand extends Command {
  schema: Schema;
  relationship: Relationship;
  referencing: Table;
  referenced: Table;
  formerPk?: ColumnCombination;

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
    this.formerPk = this.referenced.pk;
    this.schema.indRelationships.delete(this.relationship);
    this.schema.fkRelationships.add(this.relationship);
    this.referenced.pk = this.relationship.referenced();
  }

  protected override _undo(): void {
    this.schema.fkRelationships.delete(this.relationship);
    this.schema.indRelationships.add(this.relationship);
    this.referenced.pk = this.formerPk;
  }

  protected override _redo(): void {
    this.schema.indRelationships.delete(this.relationship);
    this.schema.fkRelationships.add(this.relationship);
    this.referenced.pk = this.relationship.referenced();
  }
}
