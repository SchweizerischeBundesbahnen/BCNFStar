import Column from './Column';
import ColumnCombination from './ColumnCombination';
import FunctionalDependency from './FunctionalDependency';
import ITable from '@server/definitions/ITable';
import Relationship from './Relationship';
import FdScore from './methodObjects/FdScore';
import { TableRelationship } from '../types/TableRelationship';
import SourceTable from './SourceTable';
import SourceColumn from './SourceColumn';
import SourceTableInstance from './SourceTableInstance';
import SourceRelationship from './SourceRelationship';

export default class Table {
  public name = '';
  public schemaName = '';
  public columns = new ColumnCombination();
  public pk?: ColumnCombination = undefined;
  public fds: Array<FunctionalDependency> = [];
  public relationships = new Set<Relationship>();
  public sources = new Array<SourceTableInstance>();
  private _violatingFds?: Array<FunctionalDependency>;
  private _keys?: Array<ColumnCombination>;

  /**
   * cached results of schema.splitteableFdClustersOf(this). Should not be accessed from outside the schema class
   */
  public _splittableFdClusters!: Array<{
    columns: ColumnCombination;
    fds: Array<FunctionalDependency>;
  }>;
  /**
  /**
   * cached results of schema.fksOf(this). Should not be accessed from outside the schema class
   */
  public _fks!: Array<TableRelationship>;
  /**
   * cached results of schema.indsOf(this). Should not be accessed from outside the schema class
   */
  public _inds!: Map<SourceRelationship, Array<TableRelationship>>;
  /**
   * This variable tracks if the cached results fks and inds are still valid
   */
  public _relationshipsValid = true;

  public constructor(columns?: ColumnCombination) {
    if (columns) this.columns = columns;
  }

  public static fromITable(iTable: ITable): Table {
    const sourceTable = new SourceTable(iTable.name, iTable.schemaName);
    const table = new Table();
    const sourceTableInstance = table.addSource(sourceTable);
    iTable.attributes.forEach((iAttribute, index) => {
      let sourceColumn = new SourceColumn(
        iAttribute.name,
        sourceTable,
        iAttribute.dataType,
        index,
        iAttribute.nullable
      );
      table.columns.add(new Column(sourceTableInstance, sourceColumn));
    });
    table.name = sourceTable.name;
    table.schemaName = sourceTable.schemaName;
    return table;
  }

  // should/must not be used in production as important information (datatype and nullable) are missing
  public static fromColumnNames(columnNames: Array<string>, tableName: string) {
    let sourceTable = new SourceTable(tableName, '');
    let sourceTableInstance = new SourceTableInstance(sourceTable);
    let table = new Table();
    columnNames.forEach((name, i) =>
      table.columns.add(
        new Column(
          sourceTableInstance,
          new SourceColumn(name, sourceTable, 'unknown data type', i, false)
        )
      )
    );
    table.name = tableName;
    table.sources.push(sourceTableInstance);
    return table;
  }

  public addSource(
    sourceTable: SourceTable,
    name?: string
  ): SourceTableInstance {
    const newSource = new SourceTableInstance(sourceTable, name);
    const sameAlias = this.sources.filter(
      (source) => source.baseAlias == newSource.baseAlias
    );
    newSource.id = sameAlias.length + 1;
    if (sameAlias.length == 1) {
      sameAlias[0].useAlias = true;
      sameAlias[0].useId = true;
    }
    if (sameAlias.length >= 1) {
      newSource.useAlias = true;
      newSource.useId = true;
    }

    this.sources.push(newSource);
    return newSource;
  }

  /**
   * returns the name of the table in the format "{schemaName}.{tableName}"
   */
  public get fullName(): string {
    return this.schemaName + '.' + this.name;
  }

  public get numColumns(): number {
    return this.columns.cardinality;
  }

  public setFds(...fds: Array<FunctionalDependency>) {
    this.fds = fds;
    this.fds = fds.filter((fd) => !fd.isFullyTrivial()); // needed?
  }

  public addFd(lhs: ColumnCombination, rhs: ColumnCombination) {
    this.fds.push(new FunctionalDependency(lhs, rhs));
  }

  public remainingSchema(fd: FunctionalDependency): ColumnCombination {
    return this.columns.copy().setMinus(fd.rhs).union(fd.lhs);
  }

  public generatingSchema(fd: FunctionalDependency): ColumnCombination {
    return fd.rhs.copy();
  }

  public split(
    fd: FunctionalDependency,
    generatingName?: string
  ): Array<Table> {
    let remaining: Table = new Table(this.remainingSchema(fd).setMinus(fd.lhs));
    fd.lhs.asArray().forEach((column) => remaining.columns.add(column.copy()));
    let generating: Table = new Table(this.generatingSchema(fd));

    this.projectRelationships(remaining);
    this.projectRelationships(generating);

    this.projectFds(remaining);
    this.projectFds(generating);

    remaining.pk = this.pk;
    generating.pk = fd.lhs.copy();

    remaining.schemaName = this.schemaName;
    remaining.name = this.name;

    generating.schemaName = this.schemaName;
    generating.name =
      generatingName || fd.lhs.columnNames().join('_').substring(0, 50);

    return [remaining, generating];
  }

  public projectRelationships(table: Table): void {
    // Annahme: relationship.referenced bzw. relationship.referencing columns kommen alle aus der gleichen sourceTable
    let neededSourceTables = new Set(table.columns.sourceTableInstances());
    let sourceTables = new Array(...this.sources);
    let relationships = new Set(this.relationships);

    let toRemove: Set<SourceTableInstance>;
    do {
      toRemove = new Set();
      sourceTables.forEach((sourceTable) => {
        let adjacentRelationship = [...relationships].filter(
          (rel) =>
            rel.referenced.sourceTableInstance() == sourceTable ||
            rel.referencing.sourceTableInstance() == sourceTable
        );
        if (
          adjacentRelationship.length == 1 &&
          !neededSourceTables.has(sourceTable)
        ) {
          toRemove.add(sourceTable);
          relationships.delete(adjacentRelationship[0]);
        }
      });
      sourceTables = sourceTables.filter(
        (sourceTable) => !toRemove.has(sourceTable)
      );
    } while (toRemove.size > 0);

    table.sources = sourceTables;
    table.relationships = relationships;
  }

  public projectFds(table: Table): void {
    this.fds.forEach((fd) => {
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

  public join(
    referenced: Table,
    relationship: Relationship,
    name?: string
  ): Table {
    let newTable = new Table();

    // source tables
    this.sources.forEach((sourceTable) => newTable.sources.push(sourceTable));

    const sourceMapping = new Map<SourceTableInstance, SourceTableInstance>();
    referenced.sources.forEach((source) => {
      const newSource = newTable.addSource(source.table, name);
      sourceMapping.set(source, newSource);
    });

    // columns
    newTable.columns.add(...this.columns);
    newTable.columns.add(
      ...referenced.columns.applySourceMapping(sourceMapping)
    );
    newTable.columns.delete(...relationship.referencing);

    // relationships
    this.relationships.forEach((rel) => newTable.relationships.add(rel));
    referenced.relationships.forEach((rel) =>
      newTable.relationships.add(rel.applySourceMapping(sourceMapping))
    );
    if (!relationship.sourceRelationship().isTrivial) {
      newTable.relationships.add(
        relationship.applySourceMapping(sourceMapping)
      );
    }

    // name, pk
    newTable.name = this.name;
    newTable.pk = this.pk
      ? relationship
          .referencingToReferencedColumnsIn(this.pk)
          .applySourceMapping(sourceMapping)
      : undefined;
    newTable.schemaName = this.schemaName;

    return newTable;
  }

  public columnsBySourceTableInstance() {
    const result = new Map<SourceTableInstance, ColumnCombination>();

    for (const column of this.columns) {
      if (!result.has(column.sourceTableInstance))
        result.set(column.sourceTableInstance, new ColumnCombination());
      result.get(column.sourceTableInstance)!.add(column);
    }
    return result;
  }

  /**
   *
   * @param sourceColumns columns to be matched. Must come from the same SourceTable
   * @returns all sets of columns - each set coming from the same SourceTableInstance - which match the sourceColumns
   */
  public columnsEquivalentTo(
    sourceColumns: Array<SourceColumn>
  ): Array<Array<Column>> {
    const result = new Array<Array<Column>>();
    const sourceTable = sourceColumns[0].table;

    for (const [
      sourceTableInstance,
      columns,
    ] of this.columnsBySourceTableInstance().entries()) {
      if (!sourceTableInstance.table.equals(sourceTable)) continue;

      const equivalentColumns = columns.columnsEquivalentTo(sourceColumns);
      if (equivalentColumns) result.push(equivalentColumns);
    }
    return result;
  }

  public isKeyFd(fd: FunctionalDependency): boolean {
    // assume fd is fully extended
    // TODO what about null values
    return fd.rhs.equals(this.columns);
  }

  public isKey(columns: ColumnCombination): boolean {
    if (this.keys().find((cc) => cc.equals(columns))) return true;
    else return false;
  }

  public isBCNFViolating(fd: FunctionalDependency): boolean {
    if (this.isKeyFd(fd)) return false;
    if (fd.lhs.cardinality == 0) return false;
    if (this.pk && !this.pk.isSubsetOf(this.remainingSchema(fd))) return false;
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
      this._violatingFds = this.fds
        .filter((fd) => this.isBCNFViolating(fd))
        .sort((fd1, fd2) => {
          let score1 = new FdScore(this, fd1).get();
          let score2 = new FdScore(this, fd2).get();
          return score2 - score1;
        });
    }
    return this._violatingFds;
  }

  public toString(): string {
    let str = `${this.name}(${this.columns.toString()})\n`;
    str += this.fds.map((fd) => fd.toString()).join('\n');
    return str;
  }

  public toITable(): ITable {
    return {
      name: this.name,
      schemaName: this.schemaName,
      attributes: this.columns.asArray().map((attr) => attr.toIAttribute()),
    };
  }
}
