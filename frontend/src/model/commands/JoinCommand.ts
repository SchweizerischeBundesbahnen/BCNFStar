import Relationship from '../schema/Relationship';
import Schema from '../schema/Schema';
import Table from '../schema/Table';
import Command from './Command';

export default class JoinCommand extends Command {
  schema: Schema;
  tables: Array<Table>;
  relationship: Relationship;
  parent?: Table;

  public constructor(
    schema: Schema,
    table1: Table,
    table2: Table,
    relationship: Relationship
  ) {
    super();
    this.schema = schema;
    this.tables = [table1, table2];
    this.relationship = relationship;
  }

  protected override _do(): void {
    this.parent = this.schema.join(
      this.tables[0],
      this.tables[1],
      this.relationship
    );
  }

  protected override _undo(): void {
    this.schema.delete(this.parent!);
    this.schema.add(...this.tables);
  }

  protected override _redo(): void {
    this.schema.delete(...this.tables);
    this.schema.add(this.parent!);
  }
}
