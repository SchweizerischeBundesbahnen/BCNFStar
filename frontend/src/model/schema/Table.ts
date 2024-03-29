import Column from './Column';
import ColumnCombination from './ColumnCombination';
import FunctionalDependency from './FunctionalDependency';
import ITable from '@server/definitions/ITable';
import Relationship from './Relationship';
import FdScore from './methodObjects/FdScore';
import SourceTable from './SourceTable';
import SourceColumn from './SourceColumn';
import SourceTableInstance from './SourceTableInstance';
import { FdCluster } from '../types/FdCluster';
import BasicTable from './BasicTable';
import ColumnsTree from './ColumnsTree';
import SourceRelationship from './SourceRelationship';
import TableRelationship from './TableRelationship';
import JaroWinklerDistance from './methodObjects/JaroWinklerDistance';
import { ConstraintPolicy } from '../types/ConstraintPolicy';

/** A working table that is the result of any number of split and join operations. */
export default class Table extends BasicTable {
  // defining properties

  public columns: ColumnCombination;
  public pk?: ColumnCombination = undefined;
  public sources = new Array<SourceTableInstance>();
  public relationships = new Array<Relationship>();
  public surrogateKey: string = '';

  // cached results

  public fds: Array<FunctionalDependency> = [];
  private _violatingFds?: Array<FunctionalDependency>;
  private _keys?: Array<ColumnCombination>;
  private _fdClusters?: Array<FdCluster>;

  public rowCount: number = 0;
  public columnNameMatchings: Map<
    { col: SourceColumn; otherCol: SourceColumn },
    number
  > = new Map<{ col: SourceColumn; otherCol: SourceColumn }, number>();
  /**
   * cached results of schema.indsOf(this). Should not be accessed from outside the schema class
   */
  public _inds!: Map<SourceRelationship, Array<TableRelationship>>;
  /** This variable tracks if the cached inds are still valid */
  public _indsValid = false;

  public constructor(columns?: ColumnCombination) {
    super();
    this.columns = columns || new ColumnCombination();
  }

  public toJSON() {
    return {
      name: this.name,
      schemaName: this.schemaName,
      isSuggestedFact: this.isSuggestedFact,
      isRejectedFact: this.isRejectedFact,
      columns: this.columns,
      pk: this.pk,
      sk: this.surrogateKey,
      relationships: this.relationships,
      sources: this.sources,
      rowCount: this.rowCount,
      fds: this.fds,
    };
  }

  public calculateColumnMatching() {
    for (let column of this.columns) {
      for (let otherColumn of this.columns) {
        this.columnNameMatchings.set(
          { col: column.sourceColumn, otherCol: otherColumn.sourceColumn },
          new JaroWinklerDistance(
            column.sourceColumn.name,
            otherColumn.sourceColumn.name
          ).get()
        );
      }
    }
  }

  public static fromITable(iTable: ITable, rowCount: number): Table {
    const sourceTable = new SourceTable(iTable.name, iTable.schemaName);
    const table = new Table();
    const sourceTableInstance = table.addSource(sourceTable);
    iTable.attributes.forEach((iAttribute) => {
      const sourceColumn = new SourceColumn(
        iAttribute.name,
        sourceTable,
        iAttribute.dataType,
        iAttribute.nullable
      );
      table.addColumns(new Column(sourceTableInstance, sourceColumn));
    });
    table.name = sourceTable.name;
    table.schemaName = sourceTable.schemaName;
    table.rowCount = rowCount;
    table.calculateColumnMatching();
    return table;
  }

  /**
   * This way of creating Table objects should not be used in production as important information (datatype and nullable) are missing
   */
  public static fromColumnNames(
    columnNames: Array<string>,
    tableName: string,
    rowCount: number
  ) {
    const sourceTable = new SourceTable(tableName, '');
    const table = new Table();
    const sourceTableInstance = table.addSource(sourceTable);

    columnNames.forEach((name) => {
      const sourceColumn = new SourceColumn(
        name,
        sourceTable,
        'unknown data type',
        false
      );
      table.addColumns(new Column(sourceTableInstance, sourceColumn));
    });
    table.name = tableName;
    table.schemaName = '';
    table.rowCount = rowCount;
    table.calculateColumnMatching();

    return table;
  }

  public implementsSurrogateKey(): boolean {
    return this.surrogateKey.length >= 1;
  }

  /**
   * Finds a column in the tables columns which is equal to the given column.
   * Returns the column itself if no equal column is found.
   */
  public findEqualSelectedColumn(column: Column): Column {
    return (
      this.columns.asArray().find((other) => other.equals(column)) || column
    );
  }

  /**
   * Makes sure that columns that are equal to each other are replaced to be an identical object.
   * This improves the performance of comparisons and allows the usage of e.g. Array.includes().
   */
  public establishIdentities() {
    if (this.pk) {
      this.pk = new ColumnCombination(
        this.pk.asArray().map((column) => this.findEqualSelectedColumn(column))
      );
    }
    this.relationships.forEach((relationship) => {
      relationship.referencing = relationship.referencing.map((column) =>
        this.findEqualSelectedColumn(column)
      );
      relationship.referenced = relationship.referenced.map((column) =>
        this.findEqualSelectedColumn(column)
      );
    });
  }

  /** If multiple columns are given the same name, this method includes their sources in their names. */
  public resolveColumnNameDuplicates() {
    const checked = new Set<Column>();
    for (const column of this.columns) {
      if (checked.has(column)) continue;
      const sameName = this.columns
        .asArray()
        .filter((other) => other.baseAlias == column.baseAlias);
      if (sameName.length > 1)
        sameName.forEach(
          (equivColumn) => (equivColumn.includeSourceName = true)
        );
      else column.includeSourceName = false;
      sameName.forEach((column) => checked.add(column));
    }
  }

  public addColumns(...columns: Array<Column>) {
    this.columns.add(...columns);
    this.resolveColumnNameDuplicates();
  }

  public removeColumns(...columns: Array<Column>) {
    this.columns.delete(...columns);
    this.resolveColumnNameDuplicates();
  }

  /** If multiple sources are given the same name, this method adds numbers to their names. */
  public resolveSourceNameDuplicates() {
    const checked = new Set<SourceTableInstance>();
    for (const source of this.sources) {
      if (checked.has(source)) continue;
      const sameName = this.sources.filter(
        (other) => other.baseAlias == source.baseAlias
      );
      const useId = sameName.length > 1;
      sameName.forEach((equivSource, i) => {
        equivSource.id = i + 1;
        equivSource.useId = useId;
      });
      sameName.forEach((source) => checked.add(source));
    }
  }

  public addSource(
    sourceTable: SourceTable,
    name?: string
  ): SourceTableInstance {
    const newSource = new SourceTableInstance(sourceTable, name);
    this.sources.push(newSource);
    this.resolveSourceNameDuplicates();
    return newSource;
  }

  public get numColumns(): number {
    return this.columns.cardinality;
  }

  public addFd(fd: FunctionalDependency) {
    this.fds.push(fd);
  }

  /** The columns that the remaining table of a split with the fd would have. */
  public remainingTableSchema(fd: FunctionalDependency): ColumnCombination {
    return this.columns.copy().setMinus(fd.rhs).union(fd.lhs).copy();
  }

  /** The columns that the generating table of a split with the fd would have. */
  public generatingTableSchema(fd: FunctionalDependency): ColumnCombination {
    return fd.rhs.copy();
  }

  /**
   * Returns whether the given columnCombination is fully contained
   * in at least one of the tables resulting from a split with the fd.
   */
  public splitPreservesCC(
    fd: FunctionalDependency,
    cc: ColumnCombination
  ): boolean {
    return (
      cc.isSubsetOf(this.remainingTableSchema(fd)) ||
      cc.isSubsetOf(this.generatingTableSchema(fd))
    );
  }

  /** Returns the selected columns of each source of this table. */
  public columnsBySource(): Map<SourceTableInstance, ColumnCombination> {
    const result = new Map<SourceTableInstance, ColumnCombination>();

    for (const source of this.sources) {
      result.set(source, new ColumnCombination());
    }

    for (const column of this.columns) {
      result.get(column.sourceTableInstance)!.add(column);
    }
    return result;
  }

  /** Returns the sources of which not all rows of the original source table are found in this table. */
  public reducedSources(): Array<SourceTableInstance> {
    const result = new Array<SourceTableInstance>();
    for (const rel of this.relationships) {
      const instance = new ColumnCombination(
        rel.referenced
      ).sourceTableInstance();
      if (result.includes(instance)) {
        console.error('one instance is referenced by multiple relationships');
        continue;
      }
      result.push(instance);
    }
    return result;
  }

  /**
   * @returns all sets of columns - each set coming from the same sourceTableInstance - which match the sourceColumns.
   * columns from other sourceTableInstances can be included in one match, if the columns have the same values as the
   * equivalent column from the same sourceTableInstance would have.
   * @param sourceColumns columns to be matched. Must come from the same sourceTable
   * @param allowReduced do we want matches which come from reduced sources (see reducedSources)
   */
  public columnsEquivalentTo(
    sourceColumns: Array<SourceColumn>,
    allowReduced: boolean
  ): Array<Array<Column>> {
    const result = new Array<Array<Column>>();
    const sourceTable = sourceColumns[0].table;

    const columnsBySource = this.columnsBySource();

    const ambiguous = new Map<Column, Column>();
    if (allowReduced) {
      for (const rel of this.relationships) {
        for (const i in rel.referencing) {
          columnsBySource
            .get(rel.referenced[i].sourceTableInstance)!
            .add(rel.referenced[i]);
          ambiguous.set(rel.referenced[i], rel.referencing[i]);
        }
      }
    }

    for (const [sourceTableInstance, columns] of columnsBySource.entries()) {
      if (!sourceTableInstance.table.equals(sourceTable)) continue;
      if (!allowReduced && this.reducedSources().includes(sourceTableInstance))
        continue;

      let equivalentColumns = columns.columnsEquivalentTo(sourceColumns, true);
      if (!equivalentColumns) continue;
      if (allowReduced) {
        const selectedEquivalentColumns = equivalentColumns.map((column) => {
          if (this.columns.includes(column)) return column;
          while (ambiguous.has(column)) {
            column = ambiguous.get(column)!;
            if (this.columns.includes(column)) return column;
          }
          return undefined;
        });
        if (selectedEquivalentColumns.some((column) => !column)) continue;
        equivalentColumns = selectedEquivalentColumns as Array<Column>;
      }
      result.push(equivalentColumns);
    }
    return result;
  }

  /** Returns all sources in an order, so that every referenced table comes before their referencing table. */
  public sourcesTopological(): Array<SourceTableInstance> {
    const result = new Array<SourceTableInstance>();
    const numReferenced = new Map<SourceTableInstance, number>();
    const referencings = new Map<SourceTableInstance, SourceTableInstance>();

    for (const source of this.sources) {
      numReferenced.set(source, 0);
    }
    for (const rel of this.relationships) {
      const referencing = rel.referencing[0].sourceTableInstance;
      const referenced = rel.referenced[0].sourceTableInstance;
      numReferenced.set(referencing, numReferenced.get(referencing)! + 1);
      referencings.set(referenced, referencing);
    }
    while (numReferenced.size > 0) {
      const current = this.sources.find(
        (source) => numReferenced.get(source) == 0
      )!;
      result.push(current);
      numReferenced.delete(current);
      const referencing = referencings.get(current);
      if (referencing)
        numReferenced.set(referencing, numReferenced.get(referencing)! - 1);
    }
    return result;
  }

  public isKeyFd(fd: FunctionalDependency): boolean {
    return fd.rhs.equals(this.columns);
  }

  /** Returns whether there is an fd that also determines the columns, but has a smaller lhs. */
  public hasSmallerDeterminant(
    columns: ColumnCombination,
    determinant: ColumnCombination
  ): boolean {
    for (const fd of this.violatingFds()) {
      if (
        fd.lhs.isSubsetOf(determinant) &&
        !fd.lhs.equals(determinant) &&
        columns.isSubsetOf(fd.rhs)
      ) {
        return true;
      }
    }
    return false;
  }

  public isKey(columns: ColumnCombination): boolean {
    if (this.columns.isSubsetOf(columns)) return true;
    const rhs = columns.copy();
    for (const fd of this.fds) {
      if (fd.lhs.isSubsetOf(columns)) {
        rhs.union(fd.rhs);
        if (this.columns.isSubsetOf(rhs)) return true;
      }
    }
    return false;
  }

  public isBCNFViolating(fd: FunctionalDependency): boolean {
    if (this.isKeyFd(fd)) return false;
    if (fd.lhs.cardinality == 0) return false;
    return true;
  }

  public keys(): Array<ColumnCombination> {
    if (!this._keys) {
      let keys: Array<ColumnCombination> = this.fds
        .filter((fd) => this.isKeyFd(fd))
        .map((fd) => fd.lhs);
      if (keys.length == 0) keys.push(this.columns.copy());
      this._keys = keys.sort((cc1, cc2) => cc1.cardinality - cc2.cardinality);
    }
    return this._keys;
  }

  public violatingFds(): Array<FunctionalDependency> {
    if (!this._violatingFds) {
      this._violatingFds = this.fds.filter((fd) => this.isBCNFViolating(fd));
    }
    return this._violatingFds;
  }

  public nullConstraintFor(
    column: Column,
    constraintPolicy: ConstraintPolicy
  ): boolean {
    if (this.pk?.includes(column)) return false;
    if (constraintPolicy == 'minimal') return true;
    else if (constraintPolicy == 'schema')
      return column.sourceColumn.schemaNullable;
    else if (constraintPolicy == 'maximal') return column.nullable;
    throw Error();
  }

  /**
   * @param withPkFd returns cluster with or without pkFd, not needed when calculating data for redundance ranking
   * @returns FdClusters, which group functional dependencies that have the same right hand side.
   * Used in UI to make functional dependencies easier to discover.
   */
  public fdClusters(withPkFd: boolean = false): Array<FdCluster> {
    let allFds: Array<FunctionalDependency> = [...this.violatingFds()];
    // do we need this?
    // if (withPkFd && this.pk) {
    //   let newFd = new FunctionalDependency(
    //     this.pk!.copy(),
    //     this.columns.copy()
    //   );
    //   // because lhs is primary key there are so much groups like tuples in table
    //   newFd._uniqueTuplesLhs = this.rowCount;
    //   // because lhs is primary key there are no redundant data
    //   newFd._redundantTuples = 0;
    //   allFds.push(newFd);
    // }

    const fdClusterTree = new ColumnsTree<FdCluster>();
    for (let fd of allFds) {
      let cluster = fdClusterTree.get(fd.rhs);
      if (!cluster) {
        cluster = { columns: fd.rhs.copy(), fds: new Array() };
        fdClusterTree.add(cluster, cluster.columns);
      }
      cluster.fds.push(fd);
    }
    return fdClusterTree.getAll();
  }

  /**
   * sort clusters by best ranked fd per cluster
   * sort fds in cluster descending
   * @returns fd clusters sorted by ranking score
   */
  public rankedFdClusters(): Array<FdCluster> {
    if (!this._fdClusters) {
      this._fdClusters = this.scoreFdInFdClusters(this.fdClusters(true));

      // sort clusters by best ranked fd per cluster
      this._fdClusters.sort((cluster1, cluster2) => {
        const bestFdScore1 = Math.max(
          ...cluster1.fds.map((fd) => fd._score || 0)
        );
        const bestFdScore2 = Math.max(
          ...cluster2.fds.map((fd) => fd._score || 0)
        );
        if (bestFdScore1 < bestFdScore2) return 1;
        if (bestFdScore1 > bestFdScore2) return -1;
        return 0;
      });

      // sort fds in cluster descending
      this._fdClusters.forEach((cluster) =>
        cluster.fds.sort((fd1, fd2) => (fd2._score || 0) - (fd1._score || 0))
      );
    }
    return this._fdClusters;
  }

  /**
   * calculates for every fd in the clusters a ranking score
   * @param fdClusters
   * @returns fd clusters with fds with ranking scores
   */
  private scoreFdInFdClusters(fdClusters: Array<FdCluster>): Array<FdCluster> {
    fdClusters.forEach((cluster) =>
      cluster.fds.forEach((fd) => {
        new FdScore(this, fd).get();
      })
    );
    return fdClusters;
  }

  /** Returns all columns that are functionally determined by the passed columns. */
  public hull(columns: ColumnCombination): ColumnCombination {
    const rhs = columns.copy();
    for (const fd of this.fds) {
      if (fd.lhs.isSubsetOf(columns)) {
        rhs.union(fd.rhs);
      }
    }
    return rhs;
  }
}
