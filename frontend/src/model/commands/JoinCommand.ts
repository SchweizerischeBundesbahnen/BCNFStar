import Schema from '../schema/Schema';
import Table from '../schema/Table';
import { TableRelationship } from '../types/TableRelationship';
import Command from './Command';

export default class JoinCommand extends Command {
  private parent?: Table;

  public constructor(private schema: Schema, private fk: TableRelationship) {
    super();
  }

  protected override _do(): void {
    this.parent = this.schema.join(this.fk);
  }

  protected override _undo(): void {
    this.schema.deleteTables(this.parent!);
    this.schema.addTables(this.fk.referenced, this.fk.referencing);
  }

  protected override _redo(): void {
    this.schema.deleteTables(this.fk.referenced, this.fk.referencing);
    this.schema.addTables(this.parent!);
  }
}
