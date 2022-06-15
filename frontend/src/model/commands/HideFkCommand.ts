import Schema from '../schema/Schema';
import TableRelationship from '../schema/TableRelationship';
import { FkDisplayOptions } from '../types/FkDisplayOptions';
import Command from './Command';

export default class HideFkCommand extends Command {
  private priorDisplayOptions: FkDisplayOptions;
  private newDisplayOptions: FkDisplayOptions;

  public constructor(private schema: Schema, private fk: TableRelationship) {
    super();
    const currentDisplayOptions = this.schema.getFkDisplayOptions(this.fk);
    this.priorDisplayOptions = { ...currentDisplayOptions };
    this.newDisplayOptions = { ...currentDisplayOptions };
  }

  protected override _do(): void {
    this.newDisplayOptions.whitelisted = false;
    if (!this.priorDisplayOptions.filtered)
      this.newDisplayOptions.blacklisted = true;
    this._redo();
  }

  protected override _undo(): void {
    this.schema.setFkDisplayOptions(
      this.fk,
      this.priorDisplayOptions.blacklisted,
      this.priorDisplayOptions.whitelisted
    );
  }

  protected override _redo(): void {
    this.schema.setFkDisplayOptions(
      this.fk,
      this.newDisplayOptions.blacklisted,
      this.newDisplayOptions.whitelisted
    );
  }
}
