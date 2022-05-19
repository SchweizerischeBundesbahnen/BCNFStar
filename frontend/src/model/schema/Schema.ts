import TableRelationship from './TableRelationship';
import SplitCommand from '../commands/SplitCommand';
import FunctionalDependency from './FunctionalDependency';
import IndScore from './methodObjects/IndScore';
import Relationship from './Relationship';
import SourceRelationship from './SourceRelationship';
import Table from './Table';
import ColumnCombination from './ColumnCombination';
import SourceFunctionalDependency from './SourceFunctionalDependency';
import SourceTable from './SourceTable';
import SourceTableInstance from './SourceTableInstance';
import Column from './Column';
import Join from './methodObjects/Join';
import DirectDimension from './methodObjects/DirectDimension';

export default class Schema {
  public readonly tables = new Set<Table>();
  public name?: string;
  private _fks = new Array<SourceRelationship>();
  private _inds = new Array<SourceRelationship>();
  private _fds = new Map<SourceTable, Array<SourceFunctionalDependency>>();
  private _tableFksValid = false;
  private _starMode = false;

  public toJSON() {
    return {
      tables: Array.from(this.tables),
      _fks: this.fks,
      _inds: this.inds,
      _fds: [...this._fds.values()].flat(),
    };
  }

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
    this.tableIndsValid = false;
  }

  public addFd(fd: SourceFunctionalDependency) {
    if (!this._fds.has(fd.rhs[0].table)) {
      this._fds.set(fd.rhs[0].table, new Array());
    }
    this._fds.get(fd.rhs[0].table)!.push(fd);
  }

  public get starMode(): boolean {
    return this._starMode;
  }

  public set starMode(value: boolean) {
    this._starMode = value;
    this._tableFksValid = false;
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
    this._tableFksValid = valid;
    this.tableIndsValid = valid;
  }

  private set tableIndsValid(valid: boolean) {
    this.tables.forEach((table) => (table._indsValid = valid));
  }

  public isFact(table: Table): boolean {
    return this.referencesOf(table).length == 0;
  }

  /**
   * filters out routes from routesFromFactTo(table) that consist of less than 2 TableRelationships
   * or routes that would add no extra information to the fact table when joined completely
   */
  public filteredRoutesFromFactTo(
    table: Table
  ): Array<Array<TableRelationship>> {
    console.log(table.name);
    return this.routesFromFactTo(table).filter((route) => {
      if (route.length <= 1) return false;
      const dd = new DirectDimension(route);
      return dd.newTable.columns.cardinality > dd.oldTable.columns.cardinality;
    });
  }

  /**
   * @returns all routes (in the form of an array of TableRelationships) from a fact table to this table
   */
  public routesFromFactTo(table: Table): Array<Array<TableRelationship>> {
    const result = new Array<Array<TableRelationship>>();
    for (const rel of this.referencesOf(table)) {
      const routes = this.routesFromFactTo(rel.referencing);
      routes.forEach((route) => route.push(rel));
      result.push(...routes);
    }
    if (result.length == 0) result.push(new Array<TableRelationship>());
    return result;
  }

  public referencesOf(table: Table): Array<TableRelationship> {
    if (!this._tableFksValid) this.updateFks();
    return table._references;
  }

  public fksOf(table: Table): Array<TableRelationship> {
    if (!this._tableFksValid) this.updateFks();
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
    if (!table._indsValid) this.updateIndsOf(table);
    return table._inds;
  }

  private updateIndsOf(table: Table): void {
    this.calculateIndsOf(table);
    table._indsValid = true;
  }

  private updateFks(): void {
    this.calculateFks();
    this.calculateTrivialFks();
    this._tableFksValid = true;
  }

  private calculateFks(): void {
    for (const table of this.tables) {
      table._fks = new Array();
      table._references = new Array();
    }
    for (const rel of this._fks) {
      const referencings = new Map<Table, Array<Array<Column>>>();
      for (const table of this.tables) {
        const columns = table.columnsEquivalentTo(rel.referencing, true);
        if (columns.length > 0) referencings.set(table, columns);
      }
      if ([...referencings.keys()].length == 0) continue;

      const referenceds = new Map<Table, Array<Array<Column>>>();
      for (const table of this.tables) {
        const columns = table
          .columnsEquivalentTo(rel.referenced, false)
          .filter((possibleColumns) =>
            table.isKey(new ColumnCombination(possibleColumns))
          );
        if (columns.length > 0) referenceds.set(table, columns);
      }

      for (const referencedTable of referenceds.keys())
        for (const referencedColumns of referenceds.get(referencedTable)!)
          for (const referencingTable of referencings.keys())
            for (const referencingColumns of referencings.get(
              referencingTable
            )!) {
              const relationship = new TableRelationship(
                new Relationship(referencingColumns, referencedColumns),
                referencingTable,
                referencedTable
              );
              if (this.isRelationshipValid(relationship)) {
                referencingTable._fks.push(relationship);
                referencedTable._references.push(relationship);
              }
            }
    }
  }

  private isRelationshipValid(relationship: TableRelationship): boolean {
    const newTable = new Join(relationship).newTable;
    return (
      newTable.columns.cardinality >
      relationship.referencing.columns.cardinality
    );
  }

  /**
   * A table which has the same columns as another tables pk has a relationship with this table.
   * This method adds these relationships to the tables.
   */
  private calculateTrivialFks(): void {
    for (const referencingTable of this.tables) {
      for (const referencedTable of this.tables) {
        if (referencedTable == referencingTable || !referencedTable.pk)
          continue;
        const pk = referencedTable.pk!.asArray();
        const pkSourceColumns = pk.map((column) => column.sourceColumn);
        referencingTable
          .columnsEquivalentTo(pkSourceColumns, true)
          .forEach((referencingColumns) => {
            const relationship = new TableRelationship(
              new Relationship(referencingColumns, pk),
              referencingTable,
              referencedTable
            );
            if (
              !referencingTable._fks.some(
                (otherRel) =>
                  otherRel.referenced == relationship.referenced &&
                  otherRel.relationship.equals(relationship.relationship)
              ) &&
              this.isRelationshipValid(relationship)
            ) {
              referencingTable._fks.push(relationship);
              referencedTable._references.push(relationship);
            }
          });
      }
    }
  }

  /**
   * Fills table._inds with all inds where table is referencing,
   * except for the ones that are already foreign keys
   */
  private calculateIndsOf(table: Table): void {
    const onlyInds = new Array(...this.inds).filter(
      (ind) => !this.fks.find((fk) => fk.equals(ind))
    );

    table._inds = this.matchSourceRelationships(table, onlyInds);
    for (const rels of table._inds.values()) {
      rels.sort((ind1, ind2) => {
        const score1 = new IndScore(ind1.relationship).get();
        const score2 = new IndScore(ind2.relationship).get();
        return score2 - score1;
      });
    }
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
        if (!result.has(rel)) result.set(rel, []);
        ccs.forEach((cc) => {
          otherCCs.forEach((otherCC) => {
            result
              .get(rel)!
              .push(
                new TableRelationship(
                  new Relationship(cc, otherCC),
                  table,
                  otherTable
                )
              );
          });
        });
      }
    }
    return result;
  }

  public calculateFdsOf(table: Table): void {
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

  public splittableFdsOf(table: Table): Array<FunctionalDependency> {
    return table.violatingFds().filter((fd) => this.isFdSplittable(fd, table));
  }

  public fdSplitPKViolationOf(fd: FunctionalDependency, table: Table): boolean {
    return !!table.pk && !table.splitPreservesCC(fd, table.pk);
  }

  public fdSplitFKViolationsOf(
    fd: FunctionalDependency,
    table: Table
  ): Array<TableRelationship> {
    return this.fksOf(table).filter(
      (fk) =>
        !table.splitPreservesCC(
          fd,
          new ColumnCombination(fk.relationship.referencing)
        )
    );
  }

  public fdSplitReferenceViolationsOf(
    fd: FunctionalDependency,
    table: Table
  ): Array<TableRelationship> {
    return this.referencesOf(table).filter(
      (ref) =>
        !table.splitPreservesCC(
          fd,
          new ColumnCombination(ref.relationship.referenced)
        )
    );
  }

  private isFdSplittable(fd: FunctionalDependency, table: Table): boolean {
    return (
      this.fdSplitFKViolationsOf(fd, table).length == 0 &&
      this.fdSplitReferenceViolationsOf(fd, table).length == 0 &&
      !this.fdSplitPKViolationOf(fd, table)
    );
  }

  public autoNormalize(...table: Array<Table>): Array<Table> {
    let queue = new Array(...table);
    let resultingTables = new Array<Table>();
    while (queue.length > 0) {
      let current = queue.shift()!;
      if (this.splittableFdsOf(current).length > 0) {
        let split = new SplitCommand(
          this,
          current,
          this.splittableFdsOf(current)[0]
        );
        split.do();
        queue.push(...split.children!);
      } else {
        resultingTables.push(current);
      }
    }
    return resultingTables;
  }
}
