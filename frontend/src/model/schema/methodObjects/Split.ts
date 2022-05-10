import Column from '../Column';
import ColumnCombination from '../ColumnCombination';
import FunctionalDependency from '../FunctionalDependency';
import Relationship from '../Relationship';
import SourceTableInstance from '../SourceTableInstance';
import Table from '../Table';

export default class Split {
  public newTables!: [Table, Table];

  public constructor(
    private table: Table,
    private fd: FunctionalDependency,
    private generatingName?: string
  ) {
    this.split();
  }

  private split() {
    let remaining: Table = new Table(this.table.remainingSchema(this.fd));
    let generating: Table = new Table(this.table.generatingSchema(this.fd));

    this.projectSources(remaining);
    this.projectSources(generating);

    this.projectFds(remaining);
    this.projectFds(generating);

    remaining.pk = this.table.pk?.deepCopy();
    generating.pk = this.fd.lhs.deepCopy();

    remaining.schemaName = this.table.schemaName;
    generating.schemaName = this.table.schemaName;

    remaining.name = this.table.name;
    generating.name =
      this.generatingName ||
      this.fd.lhs.columnNames().join('_').substring(0, 50);

    this.substitute(generating, this.fd.lhs);

    this.newTables = [remaining, generating];
  }

  /**
   * Projects the sources (SourceTableInstances) of the split table to one of the resulting tables.
   * The projection consists of the sources from which columns are selected
   * and the sources which are needed to connect other needed sources in an SQL-Statement.
   */
  private projectSources(table: Table) {
    // Annahme: relationship.referenced bzw. relationship.referencing columns kommen alle aus der gleichen sourceTable
    let columnSources = table.columns.sourceTableInstances();

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

    table.sources = neededSources;
    table.relationships = Array.from(neededRelationships);
  }

  private projectFds(table: Table) {
    this.table.fds.forEach((fd) => {
      if (fd.lhs.isSubsetOf(table.columns)) {
        fd = new FunctionalDependency(
          fd.lhs.copy(),
          fd.rhs.copy().intersect(table.columns)
        );
        if (!fd.isFullyTrivial()) {
          table.fds.push(fd);
        }
      }
    });
  }

  /**
   * Ersetzt jede column aus columns in table durch eine kopie
   */
  private substitute(table: Table, columns: ColumnCombination) {
    const mapping = new Map<Column, Column>();
    for (const column of columns) {
      mapping.set(column, column.copy());
    }

    table.columns.columnSubstitution(mapping);
    table.pk?.columnSubstitution(mapping);
    table.relationships = table.relationships.map((relationship) => {
      return new Relationship(
        relationship.referencing.map((column) => mapping.get(column) || column),
        relationship.referenced.map((column) => mapping.get(column) || column)
      );
    });
    table.fds.forEach((fd) => {
      fd.lhs.columnSubstitution(mapping);
      fd.rhs.columnSubstitution(mapping);
    });
  }
}
