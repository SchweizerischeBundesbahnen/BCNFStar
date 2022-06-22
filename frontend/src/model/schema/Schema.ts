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
import BasicColumn from '../types/BasicColumn';
import ColumnsTree from './ColumnsTree';
import DirectDimension from './methodObjects/DirectDimension';
import SourceColumn from './SourceColumn';
import { FkDisplayOptions } from '../types/FkDisplayOptions';

export default class Schema {
  public readonly tables = new Set<Table>();
  private customFactTables = new Set<Table>();
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

  public toJSON() {
    return {
      tables: Array.from(this.tables),
      _baseFks: this._baseFks,
      _tableFks: Array.from(this._tableFks.entries()).filter(
        ([, displayOptions]) =>
          displayOptions.blacklisted || displayOptions.whitelisted
      ),
      _inds: this._inds,
      _fds: Array.from(this._fds.values()).flat(),
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

  public suggestFactTable(table: Table) {
    this.customFactTables.add(table);
    this.relationshipsValid = false;
  }

  public unsuggestFactTable(table: Table) {
    this.customFactTables.delete(table);
    this.relationshipsValid = false;
  }

  public addFks(...fks: SourceRelationship[]) {
    this._baseFks.push(...fks);
    this.deriveFks();
    this.relationshipsValid = false;
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

  private deriveFks() {
    this._fks = new Array();
    for (const fk of this._baseFks) this.addFkAndDerive(fk);
  }

  private addFkAndDerive(fk: SourceRelationship) {
    if (!this.basicAddFk(fk)) return;
    const fksToReferencing = this._fks.filter(
      (otherFk) =>
        otherFk == fk ||
        this.sourceColumnSubset(fk.referencing, otherFk.referenced)
    );
    const fksFromReferenced = this._fks.filter(
      (otherFk) =>
        otherFk == fk ||
        this.sourceColumnSubset(otherFk.referencing, fk.referenced)
    );
    for (const fkToReferencing of fksToReferencing) {
      for (const fkFromReferenced of fksFromReferenced) {
        if (fkToReferencing == fkFromReferenced) continue;
        const newRelReferencing = new Array();
        for (const referencedCol of fkFromReferenced.referencing) {
          const i = fkToReferencing.referenced.findIndex((referencingCol) => {
            if (fkToReferencing == fk || fkFromReferenced == fk)
              return referencingCol.equals(referencedCol);
            else return fk.sourceColumnsMapped(referencingCol, referencedCol);
          });
          if (i == -1) break;
          newRelReferencing.push(fkToReferencing.referencing[i]);
        }
        if (newRelReferencing.length == fkFromReferenced.referenced.length)
          this.basicAddFk(
            new SourceRelationship(
              newRelReferencing,
              Array.from(fkFromReferenced.referenced)
            )
          );
      }
    }
  }

  private basicAddFk(fk: SourceRelationship): boolean {
    if (!this._fks.some((existingFk) => existingFk.equals(fk))) {
      this._fks.push(fk);
      return true;
    }
    return false;
  }

  private sourceColumnSubset(
    subset: Array<SourceColumn>,
    superset: Array<SourceColumn>
  ): boolean {
    for (const subsetCol of subset) {
      if (!superset.some((supersetCol) => supersetCol.equals(subsetCol)))
        return false;
    }
    return true;
  }

  public deleteFk(fk: SourceRelationship) {
    this._baseFks = this._baseFks.filter((fk1) => fk1 != fk);
    this.deriveFks();
    this.relationshipsValid = false;
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

  public get starMode(): boolean {
    return this._starMode;
  }

  public set starMode(value: boolean) {
    this._starMode = value;
    for (const [fk, displayOptions] of this._tableFks.entries())
      displayOptions.filtered = this.shouldBeFiltered(fk);
  }

  private set relationshipsValid(valid: boolean) {
    this._tableFksValid = valid;
    this.tableIndsValid = valid;
  }

  private set tableIndsValid(valid: boolean) {
    this.tables.forEach((table) => (table._indsValid = valid));
  }

  /**
   * @param onlyDisplayed whether to use only the displayed fks or all fks as a basis for calculation
   */
  public isFact(table: Table, onlyDisplayed: boolean): boolean {
    return (
      this.referencesOf(table, onlyDisplayed).length == 0 ||
      this.customFactTables.has(table)
    );
  }

  public isPotentialFact(table: Table): boolean {
    return (
      this.referencesOf(table, false).length <= 1 &&
      this.fksOf(table, false).length >= 1
    ); //TODO
  }

  public isDirectDimension(table: Table): boolean {
    return this.referencesOf(table, true).some((reference) =>
      this.isFact(reference.referencing, true)
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
      if (visitedTables.includes(rel.referencing)) continue;
      const routes = this.routesFromFactTo(rel.referencing, onlyDisplayedFks, [
        ...visitedTables,
        table,
      ]);
      routes.forEach((route) => route.push(rel));
      result.push(...routes);
    }
    if (result.length == 0 || this.customFactTables.has(table))
      result.push(new Array<TableRelationship>());
    return result;
  }

  /**
   * @param onlyDisplayed whether to use only the displayed fks or all fks
   */
  public referencesOf(
    table: Table,
    onlyDisplayed: boolean
  ): Array<TableRelationship> {
    if (!this._tableFksValid) this.updateFks();
    let result = Array.from(this._tableFks.keys()).filter(
      (fk) => fk.referenced == table
    );
    if (onlyDisplayed) result = result.filter((fk) => this.isFkDisplayed(fk));
    return result;
  }

  /**
   * @param onlyDisplayed whether to use only the displayed fks or all fks
   */
  public fksOf(table: Table, onlyDisplayed: boolean): Array<TableRelationship> {
    if (!this._tableFksValid) this.updateFks();
    let result = Array.from(this._tableFks.keys()).filter(
      (fk) => fk.referencing == table
    );
    if (onlyDisplayed) result = result.filter((fk) => this.isFkDisplayed(fk));
    return result;
  }

  public hiddenFksOf(table: Table): Array<TableRelationship> {
    if (!this._tableFksValid) this.updateFks();
    return Array.from(this._tableFks.keys()).filter(
      (fk) => fk.referencing == table && !this.isFkDisplayed(fk)
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
              if (this.isRelationshipValid(relationship))
                this.addCurrentFkAndDerive(relationship);
            }
    }
  }

  private addCurrentFkAndDerive(fk: TableRelationship) {
    if (!this.basicAddCurrentFk(fk)) return;
    const fksToReferencing = Array.from(this._tableFks.keys()).filter(
      (otherFk) =>
        otherFk == fk ||
        (fk.referencing == otherFk.referenced &&
          new ColumnCombination(fk.relationship.referencing).isSubsetOf(
            new ColumnCombination(otherFk.relationship.referenced)
          ))
    );
    const fksFromReferenced = Array.from(this._tableFks.keys()).filter(
      (otherFk) =>
        otherFk == fk ||
        (otherFk.referencing == fk.referenced &&
          new ColumnCombination(otherFk.relationship.referencing).isSubsetOf(
            new ColumnCombination(fk.relationship.referenced)
          ))
    );
    for (const fkToReferencing of fksToReferencing) {
      for (const fkFromReferenced of fksFromReferenced) {
        if (fkToReferencing == fkFromReferenced) continue;
        const newRelReferencing = new Array();
        for (const referencedCol of fkFromReferenced.relationship.referencing) {
          const i = fkToReferencing.relationship.referenced.findIndex(
            (referencingCol) => {
              if (fkToReferencing == fk || fkFromReferenced == fk)
                return referencingCol.equals(referencedCol);
              else
                return fk.relationship.columnsMapped(
                  referencingCol,
                  referencedCol
                );
            }
          );
          if (i == -1) break;
          newRelReferencing.push(fkToReferencing.relationship.referencing[i]);
        }
        if (
          newRelReferencing.length ==
          fkFromReferenced.relationship.referenced.length
        )
          this.basicAddCurrentFk(
            new TableRelationship(
              new Relationship(
                newRelReferencing,
                Array.from(fkFromReferenced.relationship.referenced)
              ),
              fkToReferencing.referencing,
              fkFromReferenced.referenced
            )
          );
      }
    }
  }

  private basicAddCurrentFk(fk: TableRelationship) {
    if (fk.referencing == fk.referenced) return false;
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
      return true;
    }
    return false;
  }

  public isRelationshipValid(relationship: TableRelationship): boolean {
    const newTable = new Join(relationship).newTable;
    return (
      newTable.columns.cardinality >
        relationship.referencing.columns.cardinality &&
      relationship.referenced != relationship.referencing
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
            if (this.isRelationshipValid(relationship))
              this.addCurrentFkAndDerive(relationship);
          });
      }
    }
  }

  private shouldBeFiltered(fk: TableRelationship) {
    if (this.starMode) return this.isStarViolatingFk(fk);
    else return this.isTransitiveFk(fk);
  }

  private isTransitiveFk(
    fk: TableRelationship,
    visitedTables: Array<Table> = [],
    firstIteration: boolean = true
  ): boolean {
    if (visitedTables.includes(fk.referencing)) return false;
    visitedTables.push(fk.referencing);
    for (const otherFk of this.fksOf(fk.referencing, false)) {
      if (otherFk.equals(fk)) {
        if (firstIteration) continue;
        else return true;
      }
      const newReferencing = otherFk.relationship.columnsReferencedBy(
        fk.relationship.referencing
      );
      if (newReferencing.some((col) => !col)) continue;
      if (
        this.isTransitiveFk(
          new TableRelationship(
            new Relationship(
              newReferencing as Array<Column>,
              fk.relationship.referenced
            ),
            otherFk.referenced,
            fk.referenced
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
    if (this.isFact(fk.referenced, false)) return true;
    if (this.isFact(fk.referencing, false)) return false;
    return !this.directDimensionableRoutes(fk.referenced, false).some(
      (route) => route[route.length - 1] == fk
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
      for (const sourceFd of this._fds.get(source.table)!) {
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
    return this.referencesOf(table, true).filter(
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

  public displayedColumnsOf(table: Table): Array<BasicColumn> {
    const columns = new Array<BasicColumn>();
    if (table.implementsSurrogateKey())
      columns.push({ name: table.surrogateKey, dataTypeString: 'integer' });
    columns.push(...table.columns);
    for (const fk of this.fksOf(table, true))
      if (fk.referenced.implementsSurrogateKey()) {
        columns.push({
          name: fk.referencingName,
          dataTypeString: 'integer',
        });
      }
    return columns;
  }
}
