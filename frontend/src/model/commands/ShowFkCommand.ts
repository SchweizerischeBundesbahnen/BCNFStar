import Schema from '../schema/Schema';
import TableRelationship from '../schema/TableRelationship';
import { FkDisplayOptions } from '../types/FkDisplayOptions';
import Command from './Command';

export default class ShowFkCommand extends Command {
  private priorDisplayOptions: FkDisplayOptions;
  private newDisplayOptions: FkDisplayOptions;

  public constructor(private schema: Schema, private fk: TableRelationship) {
    super();
    this.priorDisplayOptions = this.schema.getFkDisplayOptions(this.fk);
    this.newDisplayOptions = {
      filtered: this.priorDisplayOptions.filtered,
      blacklisted: this.priorDisplayOptions.blacklisted,
      whitelisted: this.priorDisplayOptions.whitelisted,
    };
  }

  protected override _do(): void {
    this.newDisplayOptions.blacklisted = false;
    if (this.priorDisplayOptions.filtered)
      this.newDisplayOptions.whitelisted = true;
    this._redo();
  }

  protected override _undo(): void {
    this.schema.setFkDisplayOptions(this.fk, this.priorDisplayOptions);
  }

  protected override _redo(): void {
    this.schema.setFkDisplayOptions(this.fk, this.newDisplayOptions);
  }
}
