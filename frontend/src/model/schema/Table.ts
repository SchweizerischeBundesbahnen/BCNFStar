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
  public columns;
  public pk?: ColumnCombination = undefined;
  public fds: Array<FunctionalDependency> = [];
  public relationships = new Array<Relationship>();
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
    this.columns = columns || new ColumnCombination();
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

  public addFd(fd: FunctionalDependency) {
    this.fds.push(fd);
  }

  public remainingSchema(fd: FunctionalDependency): ColumnCombination {
    return this.columns.copy().setMinus(fd.rhs).union(fd.lhs);
  }

  public generatingSchema(fd: FunctionalDependency): ColumnCombination {
    return fd.rhs.copy();
  }

  /**
   * Returns the selected columns of each source of this table
   */
  public columnsBySourceTableInstance() {
    const result = new Map<SourceTableInstance, ColumnCombination>();

    for (const source of this.sources) {
      result.set(source, new ColumnCombination());
    }

    for (const column of this.columns) {
      result.get(column.sourceTableInstance)!.add(column);
    }
    return result;
  }

  public reducedSourceTableInstances() {
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
   *
   * @param sourceColumns columns to be matched. Must come from the same SourceTable
   * @returns all sets of columns - each set coming from the same SourceTableInstance - which match the sourceColumns
   */
  public columnsEquivalentTo(
    sourceColumns: Array<SourceColumn>,
    allowReduced: boolean
  ): Array<Array<Column>> {
    const result = new Array<Array<Column>>();
    const sourceTable = sourceColumns[0].table;

    const columnsByInstance = this.columnsBySourceTableInstance();

    const ambiguous = new Map<Column, Column>();
    if (allowReduced) {
      for (const rel of this.relationships) {
        for (const i in rel.referencing) {
          columnsByInstance
            .get(rel.referenced[i].sourceTableInstance)!
            .add(rel.referenced[i]);
          ambiguous.set(rel.referenced[i], rel.referencing[i]);
        }
      }
    }

    for (const [sourceTableInstance, columns] of columnsByInstance.entries()) {
      if (!sourceTableInstance.table.equals(sourceTable)) continue;
      if (
        !allowReduced &&
        this.reducedSourceTableInstances().includes(sourceTableInstance)
      )
        continue;

      const equivalentColumns = columns.columnsEquivalentTo(
        sourceColumns,
        true
      );
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
      }
      result.push(equivalentColumns);
    }
    return result;
  }

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
      const [current] = Array.from(numReferenced.entries()).find(
        ([, count]) => count == 0
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
