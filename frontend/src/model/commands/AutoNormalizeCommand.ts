import Schema from '../schema/Schema';
import Table from '../schema/Table';
import Command from './Command';

export default class AutoNormalizeCommand extends Command {
  schema: Schema;
  tables: Array<Table>;
  resultingTables?: Array<Table>;

  public constructor(schema: Schema, ...tables: Array<Table>) {
    super();
    this.schema = schema;
    this.tables = tables;
  }

  protected override _do(): void {
    this.resultingTables = this.schema.autoNormalize(...this.tables);
  }

  protected override _undo(): void {
    this.schema.delete(...this.resultingTables!);
    this.schema.add(...this.tables);
  }

  protected override _redo(): void {
    this.schema.delete(...this.tables);
    this.schema.add(...this.resultingTables!);
  }
}
