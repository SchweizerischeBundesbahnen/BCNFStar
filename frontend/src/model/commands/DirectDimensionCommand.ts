import Schema from '../schema/Schema';
import { TableRelationship } from '../types/TableRelationship';
import Command from './Command';

export default class DirectDimensionCommand extends Command {
  public constructor(
    private schema: Schema,
    private route: Array<TableRelationship>
  ) {
    super();
  }

  protected override _do(): void {}

  protected override _undo(): void {}

  protected override _redo(): void {}
}
