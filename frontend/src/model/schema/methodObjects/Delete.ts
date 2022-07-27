import ColumnCombination from '../ColumnCombination';
import SourceTableInstance from '../SourceTableInstance';
import Table from '../Table';

export default class Delete {
  public newTable!: Table;

  /**
   * @param table table to delete from
   * @param columns columns to delete
   */
  public constructor(private table: Table, private columns: ColumnCombination) {
    this.delete();
  }

  private delete() {
    this.newTable = new Table(this.table.columns.copy().setMinus(this.columns));

    this.projectSources();

    this.projectFds();

    this.newTable.surrogateKey = this.table.surrogateKey;
    this.newTable.pk = this.table.pk?.isSubsetOf(this.newTable.columns)
      ? this.table.pk.copy()
      : undefined;

    this.newTable.schemaName = this.table.schemaName;
    this.newTable.name = this.table.name;

    this.newTable.calculateColumnMatching();
    this.newTable.isSuggestedFact = this.table.isSuggestedFact;
    this.newTable.isRejectedFact = this.table.isRejectedFact;
  }

  /**
   * Projects the sources (SourceTableInstances) of the split table to one of the resulting tables.
   * The projection consists of the sources from which columns are selected
   * and the sources which are needed to connect other needed sources in an SQL-Statement.
   */
  private projectSources() {
    // Annahme: relationship.referenced bzw. relationship.referencing columns kommen alle aus der gleichen sourceTable
    let columnSources = this.newTable.columns.sourceTableInstances();

    let neededSources = new Array(...this.table.sources);
    let neededRelationships = new Set(this.table.relationships);

    let toRemove: Set<SourceTableInstance>;
    do {
      toRemove = new Set();
      neededSources.forEach((source) => {
        let adjacentRelationships = [...neededRelationships].filter(
          (rel) =>
            rel.referenced[0].sourceTableInstance == source ||
            rel.referencing[0].sourceTableInstance == source
        );
        if (
          adjacentRelationships.length == 1 &&
          !columnSources.includes(source)
        ) {
          toRemove.add(source);
          neededRelationships.delete(adjacentRelationships[0]);
        }
      });
      neededSources = neededSources.filter(
        (sourceTable) => !toRemove.has(sourceTable)
      );
    } while (toRemove.size > 0);

    this.newTable.sources = neededSources;
    this.newTable.relationships = Array.from(neededRelationships);
  }

  private projectFds() {
    this.table.fds.forEach((fd) => {
      if (fd.lhs.isSubsetOf(this.newTable.columns)) {
        const newFd = fd.copy();
        newFd.rhs.intersect(this.newTable.columns);
        if (!newFd.isFullyTrivial()) {
          this.newTable.fds.push(newFd);
        }
      }
    });
  }
}
