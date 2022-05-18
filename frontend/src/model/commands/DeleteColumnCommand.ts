import Column from '../schema/Column';
import ColumnCombination from '../schema/ColumnCombination';
import FunctionalDependency from '../schema/FunctionalDependency';
import Split from '../schema/methodObjects/Split';
import Schema from '../schema/Schema';
import Table from '../schema/Table';
import Command from './Command';

export default class DeleteColumnCommand extends Command {
  public newTable?: Table;

  public constructor(
    private schema: Schema,
    private table: Table,
    private column: Column
  ) {
    super();
  }

  protected override _do(): void {
    this.newTable = new Split(
      this.table,
      new FunctionalDependency(
        new ColumnCombination(),
        new ColumnCombination([this.column])
      )
    ).newTables[0];
    this._redo();
  }

  protected override _undo(): void {
    this.schema.deleteTables(this.newTable!);
    this.schema.addTables(this.table);
  }

  protected override _redo(): void {
    this.schema.deleteTables(this.table);
    this.schema.addTables(this.newTable!);
  }
}
