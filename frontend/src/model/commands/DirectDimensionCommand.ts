import ColumnCombination from '../schema/ColumnCombination';
import Join from '../schema/methodObjects/Join';
import Schema from '../schema/Schema';
import Table from '../schema/Table';
import { TableRelationship } from '../types/TableRelationship';
import Command from './Command';

export default class DirectDimensionCommand extends Command {
  private oldTable: Table;
  private newTable?: Table;

  public constructor(
    private schema: Schema,
    private route: Array<TableRelationship>
  ) {
    super();
    this.oldTable = route[0].referencing;
  }

  protected override _do(): void {
    this.newTable = this.oldTable;
    let newRel = this.route[0].relationship;
    for (let i = 0; i < this.route.length - 1; i++) {
      const join: Join = new Join(this.schema, {
        relationship: newRel,
        referencing: this.newTable!,
        referenced: this.route[i].referenced,
      });
      this.newTable = join.newTable;
      newRel = this.route[i + 1].relationship.applySourceMapping(
        join.sourceMapping
      );
    }
    this.newTable.columns.intersect(
      new ColumnCombination(new Array(...newRel.referencing)).union(
        this.oldTable.columns
      )
    );
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
