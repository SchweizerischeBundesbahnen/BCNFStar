import FunctionalDependency from '../schema/FunctionalDependency';
import Schema from '../schema/Schema';
import Table from '../schema/Table';
import Command from './Command';

export default class SplitCommand extends Command {
  schema: Schema;
  table: Table;
  fd: FunctionalDependency;
  // Name of the newly created table
  generatingName?: string;
  children?: Array<Table>;

  public constructor(
    schema: Schema,
    table: Table,
    fd: FunctionalDependency,
    generatingName?: string
  ) {
    super();
    this.schema = schema;
    this.table = table;
    this.fd = fd;
    this.generatingName = generatingName;
  }

  protected override _do(): void {
    this.children = this.schema.split(this.table, this.fd, this.generatingName);
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
