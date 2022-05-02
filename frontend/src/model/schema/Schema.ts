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
import Join from './methodObjects/Join';
import Split from './methodObjects/Split';
import SourceTableInstance from './SourceTableInstance';
import Column from './Column';

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
    if (!this._fds.has(fd.rhs[0].table)) {
      this._fds.set(fd.rhs[0].table, new Array());
    }
    this._fds.get(fd.rhs[0].table)!.push(fd);
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

  /**
   * Returns the inds from the given table to other tables. The inds are contained inside a map
   * to keep the information which source-ind caused which concrete inds to appear in the current
   * state of the schema.
   */
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
        const score1 = new IndScore(ind1.relationship).get();
        const score2 = new IndScore(ind2.relationship).get();
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
    const fds = new Map<SourceTableInstance, Array<FunctionalDependency>>();
    table.sources.forEach((source) => fds.set(source, new Array()));
    const columnsByInstance = table.columnsBySource();

    for (const source of table.sourcesTopological()) {
      const referencingColumns = new ColumnCombination();
      table.relationships
        .filter((rel) => rel.referencing[0].sourceTableInstance == source)
        .forEach((rel) => referencingColumns.add(...rel.referencing));
      const referencedColumns = new ColumnCombination(
        table.relationships.find(
          (rel) => rel.referenced[0].sourceTableInstance == source
        )?.referenced
      );
      const relevantColumns = columnsByInstance
        .get(source)!
        .union(referencingColumns)
        .union(referencedColumns);

      //matching (sourceFd -> Fd) and selection
      for (const sourceFd of this._fds.get(source.table)!) {
        const lhs = relevantColumns.columnsEquivalentTo(sourceFd.lhs, true);
        if (!lhs) continue;
        const rhs = relevantColumns.columnsEquivalentTo(sourceFd.rhs, false)!;
        const fd = new FunctionalDependency(
          new ColumnCombination(lhs),
          new ColumnCombination(rhs)
        );
        if (fd.isFullyTrivial()) continue;
        const existingFd = fds
          .get(source)!
          .find((other) => other.lhs.equals(fd.lhs));
        if (existingFd) existingFd.rhs.union(fd.rhs);
        else fds.get(source)!.push(fd);
      }
      //extension
      const fkFds = fds
        .get(source)!
        .filter((fd) => fd.lhs.isSubsetOf(referencingColumns));
      for (const fd of fds.get(source)!) {
        const extensions = fkFds
          .filter((fkFd) => fkFd.lhs.isSubsetOf(fd.rhs))
          .map((fkFd) => fkFd.rhs);
        extensions.forEach((extension) => fd.rhs.union(extension));
      }

      //referenced to referencing
      const nextRelationship = table.relationships.find(
        (rel) => rel.referenced[0].sourceTableInstance == source
      );
      const nextSource = nextRelationship?.referencing[0].sourceTableInstance;
      const nextRelationshipMap = new Map<Column, Column>();
      if (nextRelationship)
        for (const i in nextRelationship.referenced)
          nextRelationshipMap.set(
            nextRelationship.referenced[i],
            nextRelationship.referencing[i]
          );

      for (const fd of fds.get(source)!) {
        if (
          !fd.lhs
            .asArray()
            .every(
              (column) =>
                table.columns.includes(column) ||
                referencedColumns.includes(column)
            )
        )
          continue;
        fd.rhs = new ColumnCombination(
          fd.rhs
            .asArray()
            .filter(
              (column) =>
                table.columns.includes(column) ||
                referencedColumns.includes(column)
            )
        );
        if (fd.isFullyTrivial()) continue;
        if (
          fd.lhs.asArray().every((column) => table.columns.includes(column)) &&
          fd.rhs.asArray().every((column) => table.columns.includes(column))
        ) {
          table.addFd(fd);
        } else if (nextRelationship) {
          fd.lhs.columnSubstitution(nextRelationshipMap);
          fd.rhs.columnSubstitution(nextRelationshipMap);
          fds.get(nextSource!)!.push(fd);
        }
      }
    }
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
      let fkColumns = new ColumnCombination(fk.relationship.referencing);
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
    return new Split(this, table, fd, generatingName).newTables!;
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
    return new Join(this, fk).newTable;
  }
}
