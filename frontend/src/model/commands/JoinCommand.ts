import Schema from '../schema/Schema';
import Table from '../schema/Table';
import Command from './Command';

export default class JoinCommand extends Command {
  schema: Schema;
  tables: Array<Table>;

  parent?: Table;

  public constructor(schema: Schema, table1: Table, table2: Table) {
    super();
    this.schema = schema;
    this.tables = [table1, table2];
  }

  protected override _do(): void {
    this.parent = this.schema.join(this.tables[0], this.tables[1]);
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