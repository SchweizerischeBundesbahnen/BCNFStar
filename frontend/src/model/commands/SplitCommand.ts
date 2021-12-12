import FunctionalDependency from '../schema/FunctionalDependency';
import Schema from '../schema/Schema';
import Table from '../schema/Table';
import Command from './Command';

export default class SplitCommand extends Command {
  schema: Schema;
  table: Table;
  fd: FunctionalDependency;

  children?: Array<Table>;

  public constructor(schema: Schema, table: Table, fd: FunctionalDependency) {
    super();
    this.schema = schema;
    this.table = table;
    this.fd = fd;
  }

  protected override _do(): void {
    this.children = this.schema.split(this.table, this.fd);
  }

  protected override _undo(): void {
    this.schema.delete(...this.children!);
    this.schema.add(this.table);
  }

  protected override _redo(): void {
    this.schema.delete(this.table);
    this.schema.add(...this.children!);
  }
}
