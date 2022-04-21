import { FdCluster } from '@/src/model/types/FdCluster';
import { TableRelationship } from '../types/TableRelationship';
import FunctionalDependency from './FunctionalDependency';
import IndScore from './methodObjects/IndScore';
import Relationship from './Relationship';
import SourceRelationship from './SourceRelationship';
import Table from './Table';
import ColumnCombination from './ColumnCombination';
import SourceFunctionalDependency from './SourceFunctionalDependency';
import SourceTable from './SourceTable';

export default class Schema {
  public readonly tables = new Set<Table>();
  private _fks = new Array<SourceRelationship>();
  private _inds = new Array<SourceRelationship>();
  private _fds = new Map<SourceTable, Array<SourceFunctionalDependency>>();

  public constructor(...tables: Array<Table>) {
    this.addTables(...tables);
  }

  public addTables(...tables: Array<Table>) {
    tables.forEach((table) => {
      this.tables.add(table);
    });
    this.relationshipsValid = false;
  }

  public deleteTables(...tables: Array<Table>) {
    tables.forEach((table) => {
      this.tables.delete(table);
    });
    this.relationshipsValid = false;
  }

  public addFk(fk: SourceRelationship) {
    this._fks.push(fk);
    this.relationshipsValid = false;
  }

  public deleteFk(fk: SourceRelationship) {
    this._fks = this._fks.filter((fk1) => fk1 != fk);
    this.relationshipsValid = false;
  }

  public addInd(ind: SourceRelationship) {
    this._inds.push(ind);
    this.relationshipsValid = false;
  }

  public addFd(fd: SourceFunctionalDependency) {
    if (!this._fds.has(fd.lhs[0].table)) {
      this._fds.set(fd.lhs[0].table, new Array());
    }
    this._fds.get(fd.lhs[0].table)!.push(fd);
  }

  /**
   * Returns a copy of the foreign key relationships
   */
  public get fks(): Array<SourceRelationship> {
    return new Array(...this._fks);
  }

  /**
   * Returns a copy of the inclusion dependency relationships
   */
  public get inds(): Array<SourceRelationship> {
    return new Array(...this._inds);
  }

  private set relationshipsValid(valid: boolean) {
    this.tables.forEach((table) => (table._relationshipsValid = valid));
  }

  public fksOf(table: Table): Array<TableRelationship> {
    if (!table._relationshipsValid) this.updateRelationshipsOf(table);
    return table._fks;
  }

  public indsOf(
    table: Table
  ): Map<SourceRelationship, Array<TableRelationship>> {
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
  private calculateFksOf(table: Table): Array<TableRelationship> {
    let result = [
      ...this.matchSourceRelationships(table, this.fks).values(),
    ].flat();
    for (const otherTable of this.tables) {
      if (otherTable == table || !otherTable.pk) continue;
      const pk = otherTable.pk!.asArray();
      const sourceColumns = pk.map((column) => column.sourceColumn);
      table.columnsEquivalentTo(sourceColumns, true).forEach((cc) => {
        result.push({
          relationship: new Relationship(cc, pk),
          referencing: table,
          referenced: otherTable,
        });
      });
    }
    return result;
  }

  /**
   * @param table
   * @returns All INDs where table is referencing,
   * except for the ones that are akready foreign keys
   */
  private calculateIndsOf(
    table: Table
  ): Map<SourceRelationship, Array<TableRelationship>> {
    let onlyInds = new Array(...this.inds).filter(
      (ind) => !this.fks.find((fk) => fk.equals(ind))
    );

    let result = this.matchSourceRelationships(table, onlyInds);
    for (const rels of result.values()) {
      rels.sort((ind1, ind2) => {
        let score1 = new IndScore(ind1.relationship).get();
        let score2 = new IndScore(ind2.relationship).get();
        return score2 - score1;
      });
    }
    return result;
  }

  /**
   * Finds all valid relationships in the current state of the schema in which the parameter table
   * is referencing some other table. Uses a list of relationships that apply to the datasource
   * @param table
   * @param relationships
   * @returns
   */
  private matchSourceRelationships(
    table: Table,
    relationships: Array<SourceRelationship>
  ): Map<SourceRelationship, Array<TableRelationship>> {
    let result = new Map<SourceRelationship, Array<TableRelationship>>();
    for (const rel of relationships) {
      let ccs = table.columnsEquivalentTo(rel.referencing, true);
      if (ccs.length == 0) continue;

      for (const otherTable of this.tables) {
        if (otherTable == table) continue;
        let otherCCs = otherTable
          .columnsEquivalentTo(rel.referenced, false)
          .filter((otherCC) =>
            otherTable.isKey(new ColumnCombination(otherCC))
          );
        if (otherCCs.length == 0) continue;
        result.set(rel, []);
        ccs.forEach((cc) => {
          otherCCs.forEach((otherCC) => {
            result.get(rel)!.push({
              relationship: new Relationship(cc, otherCC),
              referencing: table,
              referenced: otherTable,
            });
          });
        });
      }
    }
    return result;
  }

  public calculateFdsOf(table: Table) {
    const sources = new Set(
      table.columns.asArray().map((column) => column.sourceTableInstance.table)
    );
    const fds = Array.from(sources)
      .map((source) => this._fds.get(source)!)
      .flat();
    const columnsByInstance = table.columnsBySourceTableInstance();
    for (const fd of fds) {
      for (const lhs of table.columnsEquivalentTo(fd.lhs, true)) {
        const possibleRhsColumns = columnsByInstance.get(
          lhs[0].sourceTableInstance
        )!;
        const rhs = possibleRhsColumns.columnsEquivalentTo(fd.rhs, false)!;
        if (lhs.length < rhs.length) {
          table.addFd(new ColumnCombination(lhs), new ColumnCombination(rhs));
        }
      }
    }
  }

  private extend(table: Table, fk: ColumnCombination) {
    //let fk = relationship.referenced;
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
      let fkColumns = fk.relationship.referencing;
      return (
        new ColumnCombination(fkColumns).isSubsetOf(
          table.remainingSchema(fd)
        ) ||
        new ColumnCombination(fkColumns).isSubsetOf(table.generatingSchema(fd))
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
    this.addTables(...tables);
    this.deleteTables(table);
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

  public join(fk: TableRelationship) {
    let newTable = fk.referencing.join(fk.referenced, fk.relationship);
    this.setFdsFor(newTable, fk.referencing, fk.referenced, fk.relationship);
    this.addTables(newTable);
    this.deleteTables(fk.referencing);
    this.deleteTables(fk.referenced);
    return newTable;
  }

  private setFdsFor(
    table: Table,
    referencing: Table,
    referenced: Table,
    relationship: Relationship
  ) {
    // copy parent fds
    referenced.fds.forEach((fd) => {
      table.addFd(fd.lhs.copy(), fd.rhs.copy());
    });
    referencing.fds.forEach((fd) => {
      let newLhs = relationship.referencingToReferencedColumnsIn(fd.lhs);
      let newRhs = relationship.referencingToReferencedColumnsIn(fd.rhs);
      if (newLhs.isSubsetOf(new ColumnCombination(relationship.referenced))) {
        let correspondingFd = table.fds.find((fd) => fd.lhs.equals(newLhs));
        if (correspondingFd) correspondingFd.rhs.union(newRhs);
        else table.addFd(newLhs, newRhs);
      } else {
        table.addFd(newLhs, newRhs);
      }
    });

    // extension
    let fk = new ColumnCombination(relationship.referenced);
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
