import Join from '../schema/methodObjects/Join';
import Schema from '../schema/Schema';
import Table from '../schema/Table';
import TableRelationship from '../schema/TableRelationship';
import Command from './Command';

export default class JoinCommand extends Command {
  public newTable?: Table;

  public constructor(
    private schema: Schema,
    private fk: TableRelationship,
    private duplicate: boolean,
    private newTableName?: string,
    private sourceName?: string
  ) {
    super();
  }

  protected override _do(): void {
    this.newTable = new Join(this.fk, this.sourceName).newTable;
    this.schema.calculateFdsOf(this.newTable);
    if (this.newTableName) this.newTable.name = this.newTableName;
    this._redo();
  }

  protected override _undo(): void {
    this.schema.deleteTables(this.newTable!);
    this.schema.addTables(this.fk.referencing);
    if (!this.duplicate) this.schema.addTables(this.fk.referenced);
  }

  protected override _redo(): void {
    this.schema.deleteTables(this.fk.referencing);
    if (!this.duplicate) this.schema.deleteTables(this.fk.referenced);
    this.schema.addTables(this.newTable!);
  }
}
