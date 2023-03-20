import Column from '../schema/Column';
import FunctionalDependency from '../schema/FunctionalDependency';
import Split from '../schema/methodObjects/Split';
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
    private nullSubstitutes?: Map<Column, string>,
    generatingName?: string
  ) {
    super();
    this.generatingName = generatingName;
  }

  protected override _do(): void {
    this.children = new Split(
      this.table,
      this.fd,
      this.nullSubstitutes,
      this.generatingName
    ).newTables;
    this._redo();
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
