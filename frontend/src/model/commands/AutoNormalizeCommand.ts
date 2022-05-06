import Schema from '../schema/Schema';
import Table from '../schema/Table';
import Command from './Command';

export default class AutoNormalizeCommand extends Command {
  private tables: Array<Table>;
  private resultingTables?: Array<Table>;

  public constructor(private schema: Schema, ...tables: Array<Table>) {
    super();
    this.tables = tables;
  }

  protected override _do(): void {
    this.resultingTables = this.schema.autoNormalize(...this.tables);
    this._redo();
  }

  protected override _undo(): void {
    this.schema.deleteTables(...this.resultingTables!);
    this.schema.addTables(...this.tables);
  }

  protected override _redo(): void {
    this.schema.deleteTables(...this.tables);
    this.schema.addTables(...this.resultingTables!);
  }
}
