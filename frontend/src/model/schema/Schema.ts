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
import BasicColumn, { surrogateKeyColumn } from '../types/BasicColumn';
import ColumnsTree from './ColumnsTree';
import DirectDimension from './methodObjects/DirectDimension';
import {
  TableFkDerivation,
  SourceFkDerivation,
} from './methodObjects/FkDerivation';
import UnionedTable from './UnionedTable';
import BasicTable from './BasicTable';
import { FkDisplayOptions } from '../types/FkDisplayOptions';
import PotentialFacts from './methodObjects/PotentialFacts';

export default class Schema {
  public readonly tables = new Set<BasicTable>();
  private potentialFacts = new Set<BasicTable>();
  public name?: string;
  /**
   * all fks from the actual database and inds that the user validated
   */
  private _baseFks = new Array<SourceRelationship>();
  /**
   * all fks that can be derived from _baseFks
   */
  private _fks = new Array<SourceRelationship>();
  /**
   * all fks in the form of TableRelationship that are valid among the current tables
   * mapped to filtered, blacklisted, whitelisted
   */
  private _tableFks = new Map<TableRelationship, FkDisplayOptions>();
  private _inds = new Array<SourceRelationship>();
  private _fds = new Map<SourceTable, Array<SourceFunctionalDependency>>();
  private _tableFksValid = false;
  private _starMode = false;

  private _regularTables?: Array<Table>;
  private _unionedTables?: Array<UnionedTable>;

  public toJSON() {
    return {
      regularTables: Array.from(this.regularTables),
      unionedTables: Array.from(this.unionedTables),
      _baseFks: this._baseFks,
      _tableFks: Array.from(this._tableFks.entries()).filter(
        ([, displayOptions]) =>
          displayOptions.blacklisted || displayOptions.whitelisted
      ),
      _inds: this._inds,
      _fds: Array.from(this._fds.values()).flat(),
    };
  }

  public merge(other: Schema) {
    const result = new Schema(...this.tables, ...other.tables);
    result._baseFks = this._baseFks.concat(other._baseFks);
    result._inds = this._inds.concat(other._inds);
    return result;
  }

  public constructor(...tables: Array<BasicTable>) {
    this.addTables(...tables);
  }

  public addTables(...tables: Array<BasicTable>) {
    tables.forEach((table) => {
      this.tables.add(table);
    });
    this.relationshipsValid = false;
    this._regularTables = undefined;
    this._unionedTables = undefined;
  }

  public deleteTables(...tables: Array<BasicTable>) {
    tables.forEach((table) => {
      this.tables.delete(table);
    });
    this.relationshipsValid = false;
    this._regularTables = undefined;
  }

  public get regularTables(): Array<Table> {
    if (this._regularTables === undefined) {
      this._regularTables = [...this.tables].filter(
        (table) => table instanceof Table
      ) as Array<Table>;
    }
    return this._regularTables;
  }

  public get unionedTables(): Array<UnionedTable> {
    if (this._unionedTables === undefined) {
      this._unionedTables = [...this.tables].filter(
        (table) => table instanceof UnionedTable
      ) as Array<UnionedTable>;
    }
    return this._unionedTables;
  }

  public suggestFact(table: BasicTable) {
    table.isSuggestedFact = true;
    this.relationshipsValid = false;
  }

  public unsuggestFact(table: BasicTable) {
    table.isSuggestedFact = false;
    this.relationshipsValid = false;
  }

  public rejectFact(table: BasicTable) {
    table.isRejectedFact = true;
    this.relationshipsValid = false;
  }

  public unrejectFact(table: BasicTable) {
    table.isRejectedFact = false;
    this.relationshipsValid = false;
  }

  public addFks(...fks: SourceRelationship[]) {
    this._baseFks.push(...fks);
    this.deriveFks(fks);
    this.relationshipsValid = false;
  }

  public deleteFk(fk: SourceRelationship) {
    this._baseFks = this._baseFks.filter((existingFk) => existingFk != fk);
    this._fks = new Array();
    this.deriveFks(this._baseFks);
    this.relationshipsValid = false;
  }

  private deriveFks(fks: SourceRelationship[]) {
    for (const fk of fks) {
      for (const actualFk of new SourceFkDerivation(this._fks, fk).result) {
        if (!this._fks.some((existingFk) => existingFk.equals(actualFk))) {
          this._fks.push(actualFk);
        }
      }
    }
  }

  public addInds(...inds: SourceRelationship[]) {
    this._inds.push(...inds);
    this.tableIndsValid = false;
  }

  public addFd(fd: SourceFunctionalDependency) {
    if (!this._fds.has(fd.rhs[0].table)) {
      this._fds.set(fd.rhs[0].table, new Array());
    }
    this._fds.get(fd.rhs[0].table)!.push(fd);
  }

  private findEquivalentFk(fk: TableRelationship) {
    if (this._tableFks.has(fk)) return fk;
    return Array.from(this._tableFks.keys()).find((otherFk) =>
      otherFk.equals(fk)
    )!;
  }

  public getFkDisplayOptions(fk: TableRelationship) {
    fk = this.findEquivalentFk(fk);
    return this._tableFks.get(fk)!;
  }

  public setFkDisplayOptions(
    fk: TableRelationship,
    blacklisted: boolean,
    whitelisted: boolean
  ) {
    fk = this.findEquivalentFk(fk);
    const displayOptions = this._tableFks.get(fk)!;
    displayOptions.blacklisted = blacklisted;
    displayOptions.whitelisted = whitelisted;
  }

  public get __starMode(): boolean {
    return this._starMode;
  }

  /**
   * Do not call directly, instead set and get schemaService.starMode
   */
  public set __starMode(value: boolean) {
    this._starMode = value;
    for (const [fk, displayOptions] of this._tableFks.entries())
      displayOptions.filtered = this.shouldBeFiltered(fk);
    if (value) this.updatePotentialFacts();
  }

  private set relationshipsValid(valid: boolean) {
    this._tableFksValid = valid;
    this.tableIndsValid = valid;
  }

  private set tableIndsValid(valid: boolean) {
    this.tables.forEach((table) => {
      if (table instanceof Table) table._indsValid = valid;
    });
  }

  /**
   * @param onlyDisplayed whether to use only the displayed fks or all fks as a basis for calculation
   */
  public isFact(table: BasicTable, onlyDisplayed: boolean): boolean {
    return (
      this.referencesOf(table, onlyDisplayed).length == 0 ||
      table.isSuggestedFact
    );
  }

  public isPotentialFact(table: BasicTable): boolean {
    if (table.isRejectedFact) return false;
    if (!this._tableFksValid) this.updateFks();
    return this.potentialFacts.has(table);
  }

  public isDirectDimension(table: BasicTable): boolean {
    return this.referencesOf(table, true).every((reference) =>
      this.isFact(reference.referencingTable, true)
    );
  }

  /**
   * filters out routes from routesFromFactTo(table) that consist of less than 2 TableRelationships
   * or routes that would add no extra information to the fact table when joined completely
   * @param onlyDisplayedFks whether to use only the displayed fks or all fks as a basis for route calculation
   */
  public directDimensionableRoutes(
    table: Table,
    onlyDisplayedFks: boolean
  ): Array<Array<TableRelationship>> {
    return this.routesFromFactTo(table, onlyDisplayedFks).filter((route) => {
      if (route.length <= 1) return false;
      const dd = new DirectDimension([route]);
      return dd.newTable.columns.cardinality > dd.oldTable.columns.cardinality;
    });
  }

  /**
   * @returns all routes (in the form of an array of TableRelationships) from a fact table to this table
   * @param onlyDisplayedFks whether to use only the displayed fks or all fks as a basis for route calculation
   */
  public routesFromFactTo(
    table: Table,
    onlyDisplayedFks: boolean,
    visitedTables: Array<Table> = []
  ): Array<Array<TableRelationship>> {
    const result = new Array<Array<TableRelationship>>();
    for (const rel of this.referencesOf(table, onlyDisplayedFks)) {
      if (visitedTables.includes(rel.referencingTable)) continue;
      const routes = this.routesFromFactTo(
        rel.referencingTable,
        onlyDisplayedFks,
        [...visitedTables, table]
      );
      routes.forEach((route) => route.push(rel));
      result.push(...routes);
    }
    if (result.length == 0 || this.isFact(table, onlyDisplayedFks))
      result.push(new Array<TableRelationship>());
    return result;
  }

  /**
   * @param onlyDisplayed whether to use only the displayed fks or all fks
   */
  public referencesOf(
    table: BasicTable,
    onlyDisplayed: boolean
  ): Array<TableRelationship> {
    if (!(table instanceof Table)) return [];
    if (!this._tableFksValid) this.updateFks();
    let result = Array.from(this._tableFks.keys()).filter(
      (fk) => fk.referencedTable == table
    );
    if (onlyDisplayed) result = result.filter((fk) => this.isFkDisplayed(fk));
    return result;
  }

  public fksOf(
    table: BasicTable,
    onlyDisplayed: boolean
  ): Array<TableRelationship> {
    if (!(table instanceof Table)) return [];
    if (!this._tableFksValid) this.updateFks();
    let result = Array.from(this._tableFks.keys()).filter(
      (fk) => fk.referencingTable == table
    );
    if (onlyDisplayed) result = result.filter((fk) => this.isFkDisplayed(fk));
    return result;
  }

  public hiddenFksOf(table: Table): Array<TableRelationship> {
    if (!this._tableFksValid) this.updateFks();
    return Array.from(this._tableFks.keys()).filter(
      (fk) => fk.referencingTable == table && !this.isFkDisplayed(fk)
    );
  }

  public isFkDisplayed(fk: TableRelationship) {
    const displayOptions = this.getFkDisplayOptions(fk)!;
    if (displayOptions.whitelisted) return true;
    if (displayOptions.blacklisted || displayOptions.filtered) return false;
    return true;
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

  public updateFks(oldFks = this._tableFks): void {
    this._tableFks = new Map<TableRelationship, FkDisplayOptions>();
    this.calculateFks();
    this.calculateTrivialFks();
    this._tableFksValid = true;
    this.calculateFkDisplayOptions(oldFks);
    if (this.__starMode) this.updatePotentialFacts();
  }

  private calculateFkDisplayOptions(
    oldFks: Map<TableRelationship, FkDisplayOptions>
  ) {
    for (const fk of Array.from(this._tableFks.keys())) {
      const equivalentOldFk = Array.from(oldFks.keys()).find((otherFk) =>
        otherFk.equals(fk)
      );
      if (equivalentOldFk)
        this._tableFks.set(fk, {
          filtered: false,
          blacklisted: oldFks.get(equivalentOldFk)!.blacklisted,
          whitelisted: oldFks.get(equivalentOldFk)!.whitelisted,
        });
      this._tableFks.get(fk)!.filtered = this.shouldBeFiltered(fk);
    }
  }

  private calculateFks(): void {
    for (const rel of this._fks) {
      const referencings = new Map<Table, Array<Array<Column>>>();
      for (const table of this.regularTables) {
        const columns = table.columnsEquivalentTo(rel.referencingCols, true);
        if (columns.length > 0) referencings.set(table, columns);
      }
      if ([...referencings.keys()].length == 0) continue;

      const referenceds = new Map<Table, Array<Array<Column>>>();
      for (const table of this.regularTables) {
        const columns = table
          .columnsEquivalentTo(rel.referencedCols, false)
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
              if (this.isRelationshipValid(relationship))
                this.addTableFk(relationship);
            }
    }
  }

  /**
   * A table which has the same columns as another tables pk has a relationship with this table.
   * This method adds these relationships to the tables.
   */
  private calculateTrivialFks(): void {
    for (const referencingTable of this.regularTables) {
      for (const referencedTable of this.regularTables) {
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
            if (this.isRelationshipValid(relationship))
              for (const newFk of new TableFkDerivation(
                Array.from(this._tableFks.keys()),
                relationship
              ).result)
                this.addTableFk(newFk);
          });
      }
    }
  }

  private shouldBeFiltered(fk: TableRelationship) {
    if (this.__starMode) return this.isStarViolatingFk(fk);
    else return this.isTransitiveFk(fk);
  }

  private isTransitiveFk(
    fk: TableRelationship,
    visitedTables: Array<Table> = [],
    firstIteration: boolean = true
  ): boolean {
    if (visitedTables.includes(fk.referencingTable)) return false;
    visitedTables.push(fk.referencingTable);
    for (const otherFk of this.fksOf(fk.referencingTable, false)) {
      if (otherFk.equals(fk)) {
        if (firstIteration) continue;
        else return true;
      }
      const newReferencing = otherFk.relationship.columnsReferencedBy(
        fk.referencingCols
      );
      if (newReferencing.some((col) => !col)) continue;
      if (
        this.isTransitiveFk(
          new TableRelationship(
            new Relationship(
              newReferencing as Array<Column>,
              fk.referencedCols
            ),
            otherFk.referencedTable,
            fk.referencedTable
          ),
          visitedTables,
          false
        )
      )
        return true;
    }
    return false;
  }

  private isStarViolatingFk(fk: TableRelationship) {
    if (this.isFact(fk.referencedTable, false)) return true;
    if (this.isFact(fk.referencingTable, false)) return false;
    return !this.directDimensionableRoutes(fk.referencedTable, false).some(
      (route) => route[route.length - 1] == fk
    );
  }

  private updatePotentialFacts() {
    this.potentialFacts = new PotentialFacts(this).potentialFacts;
  }

  private addTableFk(fk: TableRelationship) {
    if (fk.referencingTable == fk.referencedTable) return;
    if (
      !Array.from(this._tableFks.keys()).some((existingFk) =>
        existingFk.equals(fk)
      )
    ) {
      this._tableFks.set(fk, {
        filtered: false,
        blacklisted: false,
        whitelisted: false,
      });
    }
  }

  public isRelationshipValid(relationship: TableRelationship): boolean {
    const newTable = new Join(relationship).newTable;
    return (
      newTable.columns.cardinality >
        relationship.referencingTable.columns.cardinality &&
      relationship.referencedTable != relationship.referencingTable
    );
  }

  /**
   * Fills table._inds with all inds where table is referencing,
   * except for the ones that are already foreign keys
   */
  private calculateIndsOf(table: Table): void {
    const onlyInds = this._inds.filter(
      (ind) => !this._fks.find((fk) => fk.equals(ind))
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
      let ccs = table.columnsEquivalentTo(rel.referencingCols, true);
      if (ccs.length == 0) continue;

      for (const otherTable of this.regularTables) {
        if (otherTable == table) continue;
        let otherCCs = otherTable
          .columnsEquivalentTo(rel.referencedCols, false)
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
    const fds = new Map<
      SourceTableInstance,
      ColumnsTree<FunctionalDependency>
    >();
    table.sources.forEach((source) => fds.set(source, new ColumnsTree()));
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
      for (const sourceFd of this._fds.get(source.table) ?? []) {
        const lhs = relevantColumns.columnsEquivalentTo(sourceFd.lhs, true);
        if (!lhs) continue;
        const rhs = relevantColumns.columnsEquivalentTo(sourceFd.rhs, false)!;
        const fd = new FunctionalDependency(
          new ColumnCombination(lhs),
          new ColumnCombination(rhs)
        );
        if (fd.isFullyTrivial()) continue;
        const existingFd = fds.get(source)!.get(fd.lhs);
        if (existingFd) existingFd.rhs.union(fd.rhs);
        else fds.get(source)!.add(fd, fd.lhs);
      }
      //extension
      const fkFds = fds.get(source)!.getSubtree(referencingColumns);
      for (const fd of fds.get(source)!.getAll()) {
        const extensions = fkFds.getSubsets(fd.rhs).map((fkFd) => fkFd.rhs);
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

      for (const fd of fds.get(source)!.getAll()) {
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
          fds.get(nextSource!)!.add(fd, fd.lhs);
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
    return this.fksOf(table, true).filter(
      (fk) =>
        !table.splitPreservesCC(fd, new ColumnCombination(fk.referencingCols))
    );
  }

  public fdSplitReferenceViolationsOf(
    fd: FunctionalDependency,
    table: Table
  ): Array<TableRelationship> {
    return this.referencesOf(table, true).filter(
      (ref) =>
        !table.splitPreservesCC(fd, new ColumnCombination(ref.referencedCols))
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

  public isFkColumn(table: BasicTable, column: BasicColumn): boolean {
    if (!(table instanceof Table)) return false; //not supported yet
    if (!(column instanceof Column))
      return (
        !table.implementsSurrogateKey() || column.name != table.surrogateKey
      );
    for (const fk of this.fksOf(table, true))
      if (fk.referencingCols.includes(column)) return true;
    return false;
  }

  public displayedColumnsOf(table: BasicTable): Array<BasicColumn> {
    if (!this.tables.has(table)) return (table as Table).columns.asArray();
    if (table instanceof Table) {
      const columns = new Array<BasicColumn>();
      if (table.implementsSurrogateKey())
        columns.push(surrogateKeyColumn(table.surrogateKey));
      columns.push(...table.columns);
      for (const fk of this.fksOf(table, true))
        if (fk.referencedTable.implementsSurrogateKey()) {
          const name =
            fk.referencedTable.surrogateKey +
            '_' +
            fk.referencingCols.map((col) => col.name).join('_');
          columns.push(surrogateKeyColumn(name));
        }
      return columns;
    } else if (table instanceof UnionedTable) {
      return table.displayedColumns();
    } else {
      throw Error;
    }
  }
}
