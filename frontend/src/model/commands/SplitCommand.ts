import FunctionalDependency from '../schema/FunctionalDependency';
import Schema from '../schema/Schema';
import Table from '../schema/Table';
import Command from './Command';

export default class SplitCommand extends Command<Array<Table>, Table> {
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

  public override do(): Array<Table> {
    this.children = this.schema.split(this.table, this.fd);
    return this.children;
  }

  public override undo(): Table {
    this.schema.delete(...this.children!);
    this.schema.add(this.table);
    return this.table;
  }
}
