import Schema from '../schema/Schema';
import TableRelationship from '../schema/TableRelationship';
import Command from './Command';

export default class ShowFkCommand extends Command {
  private priorBools: Array<boolean>;
  private newBools: Array<boolean>;

  public constructor(private schema: Schema, private fk: TableRelationship) {
    super();
    this.priorBools = this.schema.getFkBoolsOf(this.fk);
    this.newBools = Array.from(this.priorBools);
  }

  protected override _do(): void {
    this.newBools[1] = false;
    if (this.schema.fkFiltering && this.priorBools[0]) this.newBools[2] = true;
    this._redo();
  }

  protected override _undo(): void {
    this.schema.setFkBoolsOf(this.fk, this.priorBools);
  }

  protected override _redo(): void {
    this.schema.setFkBoolsOf(this.fk, this.newBools);
  }
}
