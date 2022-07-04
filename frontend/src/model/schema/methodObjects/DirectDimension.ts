import ColumnCombination from '../ColumnCombination';
import Table from '../Table';
import TableRelationship from '../TableRelationship';
import Join from './Join';

export default class DirectDimension {
  public newTable!: Table;
  public oldTable: Table;
  private join!: Join;

  public constructor(private routes: Array<Array<TableRelationship>>) {
    this.oldTable = routes[0][0].referencingTable;
    for (const i in this.routes) {
      this.newTable = this.directDimension(+i);
      this.mapOtherRoutes(+i, this.join);
    }
  }

  private directDimension(i: number): Table {
    const route = this.routes[i];
    let oldTable = route[0].referencingTable;
    let originalColumns = oldTable.columns;
    let newTable = oldTable;
    let newRel = route[0].relationship;
    for (let j = 0; j < route.length - 1; j++) {
      this.join = new Join(
        new TableRelationship(newRel, newTable!, route[j].referencedTable)
      );
      newTable = this.join.newTable;
      newRel = route[j + 1].relationship.applySourceMapping(
        this.join.sourceMapping
      );
      originalColumns = originalColumns.applySourceMapping(
        this.join.sourceMapping
      );
    }
    newTable.columns.intersect(
      new ColumnCombination(new Array(...newRel.referencing)).union(
        originalColumns
      )
    );
    return newTable;
  }

  private mapOtherRoutes(i: number, join: Join) {
    for (let j = i + 1; j < this.routes.length; j++) {
      const nextRouteFk = this.routes[j][0];
      nextRouteFk.referencingTable = join.newTable;
      nextRouteFk.relationship.referencing =
        nextRouteFk.relationship.referencing.map(
          (col) =>
            join.newTable.columns
              .asArray()
              .find((newCol) => newCol.equals(col))!
        );
    }
  }
}
