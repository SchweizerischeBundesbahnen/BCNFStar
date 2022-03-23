import ColumnCombination from './ColumnCombination';
import FunctionalDependency from './FunctionalDependency';
import IndScore from './methodObjects/IndScore';
import Relationship from './Relationship';
import Table from './Table';

export default class Schema {
  public readonly tables = new Set<Table>();
  private _fkRelationships = new Set<Relationship>();
  private _indRelationships = new Set<Relationship>();

  public constructor(...tables: Array<Table>) {
    this.add(...tables);
  }

  public add(...tables: Array<Table>) {
    tables.forEach((table) => {
      this.tables.add(table);
    });
    this.relationshipsValid = false;
  }

  public delete(...tables: Array<Table>) {
    tables.forEach((table) => {
      this.tables.delete(table);
    });
    this.relationshipsValid = false;
  }

  /**
   * Returns a copy of the set of foreign key relationships
   */
  public get fkRelationships(): Set<Relationship> {
    return new Set(this._fkRelationships);
  }

  public set fkRelationships(fkRelationships: Set<Relationship>) {
    this._fkRelationships = fkRelationships;
    this.relationshipsValid = false;
  }

  public addFkRelationship(fkRelationship: Relationship) {
    this._fkRelationships.add(fkRelationship);
    this.relationshipsValid = false;
  }

  public deleteFkRelationship(fkRelationship: Relationship) {
    this._fkRelationships.delete(fkRelationship);
    this.relationshipsValid = false;
  }

  /**
   * Returns a copy of the set of inclusion dependency relationships
   */
  public get indRelationships(): Set<Relationship> {
    return new Set(this._indRelationships);
  }

  public set indRelationships(indRelationships: Set<Relationship>) {
    this._indRelationships = indRelationships;
    this.relationshipsValid = false;
  }

  public addIndRelationship(indRelationship: Relationship) {
    this._indRelationships.add(indRelationship);
    this.relationshipsValid = false;
  }

  private set relationshipsValid(valid: boolean) {
    this.tables.forEach((table) => (table._relationshipsValid = valid));
  }

  public fksOf(
    table: Table
  ): Set<{ relationship: Relationship; table: Table }> {
    if (!table._relationshipsValid) this.updateRelationshipsOf(table);
    return table._fks;
  }

  public indsOf(
    table: Table
  ): Array<{ relationship: Relationship; table: Table }> {
    if (!table._relationshipsValid) this.updateRelationshipsOf(table);
    return table._inds;
  }

  private updateRelationshipsOf(table: Table): void {
    table._fks = this.calculateFksOf(table);
    table._inds = this.calculateIndsOf(table);
    table._relationshipsValid = true;
  }

  private calculateFksOf(
    table: Table
  ): Set<{ relationship: Relationship; table: Table }> {
    let fks = new Set<{ relationship: Relationship; table: Table }>();
    let possibleFkRelationships = [...this.fkRelationships].filter((rel) =>
      rel.referencing().isSubsetOf(table.columns)
    );
    for (let otherTable of this.tables) {
      if (otherTable == table || !otherTable.pk) continue;

      // intersects. Apply in case of splitting tables
      let intersect = table.columns.copy().intersect(otherTable.columns);
      if (
        intersect.cardinality > 0 &&
        otherTable.pk!.equals(intersect) // TODO subset
      ) {
        fks.add({
          relationship: Relationship.fromTables(table, otherTable),
          table: otherTable,
        });
      }

      // fkRelationships
      possibleFkRelationships
        .filter((rel) => otherTable.pk!.equals(rel.referenced()))
        .forEach((relationship) => {
          fks.add({ relationship: relationship, table: otherTable });
        });
    }
    return fks;
  }

  private calculateIndsOf(
    table: Table
  ): Array<{ relationship: Relationship; table: Table }> {
    let inds = new Array<{ relationship: Relationship; table: Table }>();
    let onlyIndRelationships = new Set(this.indRelationships);
    this.fkRelationships.forEach((rel) => onlyIndRelationships.delete(rel));
    let possibleIndRelationships = [...onlyIndRelationships].filter((rel) =>
      rel.referencing().isSubsetOf(table.columns)
    );
    for (let otherTable of this.tables) {
      if (otherTable == table) continue;
      possibleIndRelationships
        .filter((rel) => rel.appliesTo(table, otherTable))
        .forEach((rel) => {
          inds.push({ relationship: rel, table: otherTable });
        });
    }
    inds.sort((ind1, ind2) => {
      let score1 = new IndScore(ind1.relationship).get();
      let score2 = new IndScore(ind2.relationship).get();
      return score2 - score1;
    });
    return inds;
  }

  public splittableFdClustersOf(
    table: Table
  ): Array<{ columns: ColumnCombination; fds: Array<FunctionalDependency> }> {
    if (!table._splittableFdClusters)
      table._splittableFdClusters = this.calculateSplittableFdClustersOf(table);
    return table._splittableFdClusters;
  }

  public calculateSplittableFdClustersOf(
    table: Table
  ): Array<{ columns: ColumnCombination; fds: Array<FunctionalDependency> }> {
    let clusters = new Array<{
      columns: ColumnCombination;
      fds: Array<FunctionalDependency>;
    }>();
    if (table.pk)
      clusters.push({
        columns: table.columns.copy(),
        fds: new Array(
          new FunctionalDependency(table.pk!.copy(), table.columns.copy())
        ),
      });
    for (let fd of this.splittableFdsOf(table)) {
      let cluster = [...clusters].find((c) => c.columns.equals(fd.rhs));
      if (!cluster) {
        cluster = { columns: fd.rhs.copy(), fds: new Array() };
        clusters.push(cluster);
      }
      cluster.fds.push(fd);
    }
    return clusters;
  }

  public splittableFdsOf(table: Table): Array<FunctionalDependency> {
    return table.violatingFds().filter((fd) => this.isFdSplittable(fd, table));
  }

  private isFdSplittable(fd: FunctionalDependency, table: Table): boolean {
    return [...this.fksOf(table)].every((fk) => {
      let fkColumns = fk.relationship.referencing();
      return (
        fkColumns.isSubsetOf(table.remainingSchema(fd)) ||
        fkColumns.isSubsetOf(table.generatingSchema(fd))
      );
    });
  }

  public split(table: Table, fd: FunctionalDependency) {
    let tables = table.split(fd);
    this.add(...tables);
    this.delete(table);
    return tables;
  }

  public autoNormalize(...table: Array<Table>): Array<Table> {
    let queue = new Array(...table);
    let resultingTables = new Array<Table>();
    while (queue.length > 0) {
      let current = queue.shift()!;
      if (this.splittableFdsOf(current).length > 0) {
        let children = this.split(current, this.splittableFdsOf(current)[0]);
        queue.push(...children);
      } else {
        resultingTables.push(current);
      }
    }
    return resultingTables;
  }

  public join(table1: Table, table2: Table, relationship: Relationship) {
    let newTable = table1.join(table2, relationship);
    this.setFdsFor(newTable, table1, table2, relationship);
    this.add(newTable);
    this.delete(table1);
    this.delete(table2);
    return newTable;
  }

  private setFdsFor(
    table: Table,
    parent1: Table,
    parent2: Table,
    relationship: Relationship
  ) {
    let referencing = relationship.appliesTo(parent1, parent2)
      ? parent1
      : parent2;
    let referenced = relationship.appliesTo(parent1, parent2)
      ? parent2
      : parent1;

    // copy parent fds
    referenced.fds.forEach((fd) => {
      table.addFd(fd.lhs.copy(), fd.rhs.copy());
    });
    referencing.fds.forEach((fd) => {
      let newLhs = relationship.referencingToReferencedColumnsIn(fd.lhs);
      let newRhs = relationship.referencingToReferencedColumnsIn(fd.rhs);
      if (newLhs.isSubsetOf(relationship.referenced())) {
        let correspondingFd = table.fds.find((fd) => fd.lhs.equals(newLhs));
        if (correspondingFd) correspondingFd.rhs.union(newRhs);
        else table.addFd(newLhs, newRhs);
      } else {
        table.addFd(newLhs, newRhs);
      }
    });

    // extension
    let fk = relationship.referenced();
    let fkFds = table.fds.filter((fd) => fd.lhs.isSubsetOf(fk));
    table.fds.forEach((fd) => {
      let rhsFkPart = fd.rhs.copy().intersect(fk);
      fkFds
        .filter((fkFd) => fkFd.lhs.isSubsetOf(rhsFkPart))
        .forEach((fkFd) => {
          fd.rhs.union(fkFd.rhs);
        });
    });
  }
}
