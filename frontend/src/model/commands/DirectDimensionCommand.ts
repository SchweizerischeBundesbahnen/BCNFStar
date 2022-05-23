import DirectDimension from '../schema/methodObjects/DirectDimension';
import Schema from '../schema/Schema';
import Table from '../schema/Table';
import TableRelationship from '../schema/TableRelationship';
import Command from './Command';

export default class DirectDimensionCommand extends Command {
  private oldTables = new Array<Table>();
  public newTables = new Array<Table>();
  private routes = new Map<Table, Array<Array<TableRelationship>>>();

  public constructor(
    private schema: Schema,
    routes: Array<Array<TableRelationship>>
  ) {
    super();
    for (const route of routes) {
      const fact = route[0].referencing;
      if (!this.oldTables.includes(fact)) {
        this.oldTables.push(fact);
        this.routes.set(fact, new Array());
      }
      this.routes.get(fact)!.push(route);
    }
  }

  protected override _do(): void {
    for (const fact of this.oldTables) {
      const routesToFact = this.routes.get(fact)!;
      for (const i in routesToFact) {
        let newTable = new DirectDimension(routesToFact[i]).newTable;
        console.log(i, newTable);
        if (+i == routesToFact.length - 1) {
          this.newTables.push(newTable);
          console.log(newTable);
        } else routesToFact[+i + 1][0].referencing = newTable;
      }
    }
    this._redo();
  }

  protected override _undo(): void {
    this.schema.deleteTables(...this.newTables);
    this.schema.addTables(...this.oldTables);
  }

  protected override _redo(): void {
    this.schema.deleteTables(...this.oldTables);
    this.schema.addTables(...this.newTables);
  }
}
