import Schema from '../schema/Schema';
import Table from '../schema/Table';
import { TableRelationship } from '../types/TableRelationship';
import Command from './Command';

export default class JoinCommand extends Command {
  private parent?: Table;

  public constructor(
    private schema: Schema,
    private fk: TableRelationship,
    private duplicate: boolean
  ) {
    super();
  }

  protected override _do(): void {
    this.parent = this.schema.join(this.fk, this.duplicate);
  }

  protected override _undo(): void {
    this.schema.deleteTables(this.parent!);
    this.schema.addTables(this.fk.referencing);
    if (!this.duplicate) this.schema.addTables(this.fk.referenced);
  }

  protected override _redo(): void {
    this.schema.deleteTables(this.fk.referencing);
    if (!this.duplicate) this.schema.deleteTables(this.fk.referenced);
    this.schema.addTables(this.parent!);
  }
}
