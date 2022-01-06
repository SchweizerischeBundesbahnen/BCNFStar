import Schema from '../schema/Schema';
import Table from '../schema/Table';
import Command from './Command';

export default class AutoNormalizeCommand extends Command {
  schema: Schema;
  previousTables: Array<Table>;
  resultingTables?: Array<Table>;

  public constructor(schema: Schema) {
    super();
    this.schema = schema;
    this.previousTables = new Array(...this.schema.tables);
  }

  protected override _do(): void {
    this.schema.autoNormalize();
    this.resultingTables = new Array(...this.schema.tables);
    console.log('do\n');
  }

  protected override _undo(): void {
    this.schema.delete(...this.resultingTables!);
    this.schema.add(...this.previousTables);
    console.log('undo\n');
  }

  protected override _redo(): void {
    this.schema.delete(...this.previousTables);
    this.schema.add(...this.resultingTables!);
  }
}
