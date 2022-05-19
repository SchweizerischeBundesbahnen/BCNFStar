import ColumnCombination from '../ColumnCombination';
import Table from '../Table';
import TableRelationship from '../TableRelationship';
import Join from './Join';

export default class DirectDimension {
  public newTable!: Table;
  private oldTable: Table;

  public constructor(private route: Array<TableRelationship>) {
    this.oldTable = this.route[0].referencing;
    this.newTable = this.oldTable;
    this.directDimension();
  }

  private directDimension() {
    let newRel = this.route[0].relationship;
    for (let i = 0; i < this.route.length - 1; i++) {
      const join: Join = new Join(
        new TableRelationship(newRel, this.newTable!, this.route[i].referenced)
      );
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
  }
}
