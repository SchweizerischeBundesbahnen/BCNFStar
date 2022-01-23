import Relationship from '../schema/Relationship';
import Schema from '../schema/Schema';
import Table from '../schema/Table';
import Command from './Command';

export default class JoinCommand extends Command {
  schema: Schema;
  relationship: Relationship;
  tables?: Array<Table>;
  parent?: Table;

  public constructor(schema: Schema, relationship: Relationship) {
    super();
    this.schema = schema;
    this.relationship = relationship;
  }

  protected override _do(): void {
    this.tables = this.schema.tablesForInd(this.relationship);
    this.parent = this.schema.basicJoin(
      this.tables[0],
      this.tables[1],
      this.relationship
    );
  }

  protected override _undo(): void {
    this.schema.delete(this.parent!);
    this.schema.add(...this.tables!);
    this.schema.fkRelationships.add(this.relationship!);
  }

  protected override _redo(): void {
    this.schema.delete(...this.tables!);
    this.schema.add(this.parent!);
    this.schema.fkRelationships.delete(this.relationship!);
  }
}
