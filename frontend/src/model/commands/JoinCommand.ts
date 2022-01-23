import Relationship from '../schema/Relationship';
import Schema from '../schema/Schema';
import Table from '../schema/Table';
import Command from './Command';

export default class JoinCommand extends Command {
  schema: Schema;
  tables: Array<Table>;
  relationship?: Relationship;
  parent?: Table;

  public constructor(schema: Schema, table1: Table, table2: Table) {
    super();
    this.schema = schema;
    this.tables = [table1, table2];
  }

  protected override _do(): void {
    this.relationship = this.schema.fkRelationshipBetween(
      this.tables[0],
      this.tables[1]
    );
    this.parent = this.schema.joinFk(this.tables[0], this.tables[1]);
  }

  protected override _undo(): void {
    this.schema.delete(this.parent!);
    this.schema.add(...this.tables);
    this.schema.fkRelationships.add(this.relationship!);
  }

  protected override _redo(): void {
    this.schema.delete(...this.tables);
    this.schema.add(this.parent!);
    this.schema.fkRelationships.delete(this.relationship!);
  }
}
