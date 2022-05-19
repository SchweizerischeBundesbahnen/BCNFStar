import DirectDimension from '../schema/methodObjects/DirectDimension';
import Schema from '../schema/Schema';
import Table from '../schema/Table';
import TableRelationship from '../schema/TableRelationship';
import Command from './Command';

export default class DirectDimensionCommand extends Command {
  private oldTable: Table;
  public newTable?: Table;

  public constructor(
    private schema: Schema,
    private route: Array<TableRelationship>
  ) {
    super();
    this.oldTable = route[0].referencing;
  }

  protected override _do(): void {
    this.newTable = new DirectDimension(this.route).newTable;
    this._redo();
  }

  protected override _undo(): void {
    this.schema.deleteTables(this.newTable!);
    this.schema.addTables(this.oldTable);
  }

  protected override _redo(): void {
    this.schema.deleteTables(this.oldTable);
    this.schema.addTables(this.newTable!);
  }
}
