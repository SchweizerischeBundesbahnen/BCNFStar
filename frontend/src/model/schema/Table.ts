import Column from './Column';
import ColumnCombination from './ColumnCombination';
import FunctionalDependency from './FunctionalDependency';
import ITable from '@server/definitions/ITable';
import Relationship from './Relationship';
import FdScore from './methodObjects/FdScore';
import TableIdentifier from './TableIdentifier';
import ColumnIdentifier from './ColumnIdentifier';

export default class Table {
  public name = '';
  public schemaName = '';
  public columns = new ColumnCombination();
  public pk?: ColumnCombination = undefined;
  public fds: Array<FunctionalDependency> = [];
  public relationships = new Set<Relationship>();
  public sources = new Set<TableIdentifier>();
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
  public _fks!: Set<{ relationship: Relationship; table: Table }>;
  /**
   * cached results of schema.indsOf(this). Should not be accessed from outside the schema class
   */
  public _inds!: Array<{ relationship: Relationship; table: Table }>;
  /**
   * This variable tracks if the cached results fks and inds are still valid
   */
  public _relationshipsValid = true;

  public constructor(columns?: ColumnCombination) {
    if (columns) {
      this.columns = columns;
      columns
        .sourceTables()
        .forEach((sourceTable) => this.sourceTables.add(sourceTable));
    }
  }

  public static fromITable(iTable: ITable): Table {
    let columns = new ColumnCombination();
    let table = new Table(columns);
    let tableIdentifier = new TableIdentifier(iTable.name, iTable.schemaName);
    iTable.attributes.forEach((iAttribute, index) => {
      let columnIdentifier = new ColumnIdentifier(
        iAttribute.name,
        tableIdentifier
      );
      columns.add(
        new Column(
          iAttribute.name,
          iAttribute.dataType,
          index,
          columnIdentifier
        )
      );
    });
    table.name = iTable.name;
    table.schemaName = iTable.schemaName;
    table.sources.add(tableIdentifier);
    return table;
  }

  public schemaAndName(): string {
    return this.schemaName + '.' + this.name;
  }

  public static fromColumnNames(columnNames: Array<string>, tableName: string) {
    const table: Table = new Table();
    table.name = tableName;
    let tableIdentifier = new TableIdentifier(tableName, '');
    columnNames.forEach((name, i) =>
      table.columns.add(
        new Column(
          name,
          'unknown data type',
          i,
          new ColumnIdentifier(name, tableIdentifier)
        )
      )
    );
    table.sources.add(table);
    return table;
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
    fd.lhs.asSet().forEach((column) => remaining.columns.add(column.copy()));
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
    let neededSourceTables = new Set(table.columns.sourceTables());
    let sourceTables = new Set(this.sources);
    let relationships = new Set(this.relationships);

    let toRemove: Set<TableIdentifier>;
    do {
      toRemove = new Set();
      sourceTables.forEach((sourceTable) => {
        let adjacentRelationship = [...relationships].filter(
          (rel) =>
            rel.referenced().sourceTable() == sourceTable ||
            rel.referencing().sourceTable() == sourceTable
        );
        if (
          adjacentRelationship.length == 1 &&
          !neededSourceTables.has(sourceTable)
        ) {
          toRemove.add(sourceTable);
          relationships.delete(adjacentRelationship[0]);
        }
      });
      toRemove.forEach((table) => sourceTables.delete(table));
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

  public join(otherTable: Table, relationship: Relationship): Table {
    let remaining = relationship.appliesTo(this, otherTable)
      ? this
      : otherTable;
    let generating = relationship.appliesTo(this, otherTable)
      ? otherTable
      : this;

    // columns
    let newTable = new Table(
      generating.columns
        .copy()
        .union(remaining.columns)
        .setMinus(relationship.referencing())
        .union(relationship.referenced())
    );

    // relationships
    this.relationships.forEach((rel) => newTable.relationships.add(rel));
    otherTable.relationships.forEach((rel) => newTable.relationships.add(rel));
    if (!relationship.referenced().equals(relationship.referencing()))
      newTable.relationships.add(relationship);

    // name, pk
    newTable.name = remaining.name;
    newTable.pk = remaining.pk
      ? relationship.referencingToReferencedColumnsIn(remaining.pk)
      : undefined;
    newTable.schemaName = remaining.schemaName;

    // source tables
    this.sources.forEach((sourceTable) => newTable.sources.add(sourceTable));
    otherTable.sources.forEach((sourceTable) =>
      newTable.sources.add(sourceTable)
    );

    return newTable;
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
