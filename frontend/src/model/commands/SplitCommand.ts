import FunctionalDependency from '../schema/FunctionalDependency';
import Schema from '../schema/Schema';
import Table from '../schema/Table';
import Command from './Command';

export default class SplitCommand extends Command {
  // Name of the newly created table
  private generatingName?: string;
  public children?: Array<Table>;

  public constructor(
    private schema: Schema,
    public table: Table,
    private fd: FunctionalDependency,
    generatingName?: string
  ) {
    super();
    this.generatingName = generatingName;
  }

  protected override _do(): void {
    this.children = this.schema.split(this.table, this.fd, this.generatingName);
  }

  protected override _undo(): void {
    this.schema.deleteTables(...this.children!);
    this.schema.addTables(this.table);
  }

  protected override _redo(): void {
    this.schema.deleteTables(this.table);
    this.schema.addTables(...this.children!);
  }
}
