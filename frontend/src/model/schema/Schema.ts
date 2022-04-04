import { FdCluster } from '@/src/model/types/FdCluster';
import { TableRelationship } from '../types/TableRelationship';
import FunctionalDependency from './FunctionalDependency';
import IndScore from './methodObjects/IndScore';
import Relationship from './Relationship';
import Table from './Table';

export default class Schema {
  public readonly tables = new Set<Table>();
  private _fks = new Set<Relationship>();
  private _inds = new Set<Relationship>();

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
  public get fks(): Set<Relationship> {
    return new Set(this._fks);
  }

  public set fks(fkRelationships: Set<Relationship>) {
    this._fks = fkRelationships;
    this.relationshipsValid = false;
  }

  public addFk(fk: Relationship) {
    this._fks.add(fk);
    this.relationshipsValid = false;
  }

  public deleteFk(fk: Relationship) {
    this._fks.delete(fk);
    this.relationshipsValid = false;
  }

  /**
   * Returns a copy of the set of inclusion dependency relationships
   */
  public get inds(): Set<Relationship> {
    return new Set(this._inds);
  }

  public set inds(inds: Set<Relationship>) {
    this._inds = inds;
    this.relationshipsValid = false;
  }

  public addInd(ind: Relationship) {
    this._inds.add(ind);
    this.relationshipsValid = false;
  }

  private set relationshipsValid(valid: boolean) {
    this.tables.forEach((table) => (table._relationshipsValid = valid));
  }

  public fksOf(table: Table): Set<TableRelationship> {
    if (!table._relationshipsValid) this.updateRelationshipsOf(table);
    return table._fks;
  }

  public indsOf(table: Table): Array<TableRelationship> {
    if (!table._relationshipsValid) this.updateRelationshipsOf(table);
    return table._inds;
  }

  private updateRelationshipsOf(table: Table): void {
    table._fks = this.calculateFksOf(table);
    table._inds = this.calculateIndsOf(table);
    table._relationshipsValid = true;
  }

  /**
   *
   * @param table
   * @returns FKs, where table is on the referencing side
   */
  private calculateFksOf(table: Table): Set<TableRelationship> {
    let fks = new Set<TableRelationship>();
    let possibleFkRelationships = [...this.fks].filter((rel) =>
      rel.referencing().isSubsetOf(table.columns)
    );
    for (let otherTable of this.tables) {
      if (otherTable == table) continue;

      // intersects. Apply in case of splitting tables
      let intersect = table.columns.copy().intersect(otherTable.columns);
      if (
        intersect.cardinality > 0 &&
        otherTable.isKey(intersect) // TODO subset
      ) {
        fks.add({
          relationship: Relationship.fromTables(table, otherTable),
          referenced: otherTable,
          referencing: table,
        });
      }

      // fkRelationships
      possibleFkRelationships
        .filter((rel) => otherTable.isKey(rel.referenced()))
        .forEach((relationship) => {
          fks.add({
            relationship: relationship,
            referencing: table,
            referenced: otherTable,
          });
        });
    }
    return fks;
  }

  /**
   * @param table
   * @returns All INDs where table is referencing,
   * except for the ones that are akready foreign keys
   */
  private calculateIndsOf(table: Table): Array<TableRelationship> {
    let inds = new Array<TableRelationship>();
    let onlyIndRelationships = new Set(this.inds);
    // TODO: find out why this doesn't delete anythign anymore
    this.fks.forEach((rel) => onlyIndRelationships.delete(rel));
    let possibleIndRelationships = [...onlyIndRelationships].filter((rel) =>
      rel.referencing().isSubsetOf(table.columns)
    );
    for (let otherTable of this.tables) {
      if (otherTable == table) continue;
      possibleIndRelationships
        .filter(
          (rel) =>
            rel.appliesTo(table, otherTable) &&
            otherTable.isKey(rel.referenced())
        )
        .forEach((rel) => {
          inds.push({
            relationship: rel,
            referenced: otherTable,
            referencing: table,
          });
        });
    }
    inds.sort((ind1, ind2) => {
      let score1 = new IndScore(ind1.relationship).get();
      let score2 = new IndScore(ind2.relationship).get();
      return score2 - score1;
    });
    return inds;
  }

  public splittableFdClustersOf(table: Table): Array<FdCluster> {
    if (!table._splittableFdClusters)
      table._splittableFdClusters = this.calculateSplittableFdClustersOf(table);
    return table._splittableFdClusters;
  }

  public calculateSplittableFdClustersOf(table: Table): Array<FdCluster> {
    let clusters = new Array<FdCluster>();
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

  /**
   *
   * @param table Table to split
   * @param fd Functional Dependency to split on
   * @param generatingName Name to give to the newly created table
   * @returns the resulting tables
   */
  public split(
    table: Table,
    fd: FunctionalDependency,
    generatingName?: string
  ) {
    let tables = table.split(fd, generatingName);
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
