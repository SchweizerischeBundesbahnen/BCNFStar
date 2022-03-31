import Table from '../schema/Table';
import Command from './Command';

export default class TableRenameCommand extends Command {
  table: Table;
  oldName?: string;
  newName: string;

  public constructor(table: Table, name: string) {
    super();
    this.table = table;
    this.newName = name;
  }

  protected override _do(): void {
    this.oldName = this.table.name;
    this.table.name = this.newName;
  }

  protected override _undo(): void {
    this.table.name = this.oldName!;
  }

  protected override _redo(): void {
    this.table.name = this.newName;
  }
}
