import Column from './Column';
import Schema from './Schema';
import ColumnCombination from './ColumnCombination';
import FunctionalDependency from './FunctionalDependency';
import ITable from '@server/definitions/ITable';
import Relationship from './Relationship';

export default class Table {
  public name = '';
  public columns = new ColumnCombination();
  public pk?: ColumnCombination = undefined;
  public fds: Array<FunctionalDependency> = [];
  public schema?: Schema;
  public relationships = new Array<Relationship>();
  private _violatingFds?: Array<FunctionalDependency>;
  private _keys?: Array<ColumnCombination>;

  public constructor(columns?: ColumnCombination) {
    if (columns) this.columns = columns;
  }

  public static fromITable(iTable: ITable): Table {
    let columns = new ColumnCombination();
    let table = new Table(columns);
    iTable.attribute.forEach((iAttribute, index) => {
      columns.add(
        new Column(iAttribute.name, iAttribute.dataType, index, table)
      );
    });
    table.name = iTable.name; //mermaid tablenames must not contain dots
    return table;
  }

  public static fromColumnNames(...names: Array<string>) {
    const table: Table = new Table();
    names.forEach((name, i) =>
      table.columns.add(new Column(name, '?', i, table))
    );
    return table;
  }

  public sourceTables(): Array<Table> {
    return this.columns.sourceTables();
  }

  public get mermaidName(): string {
    return this.name
      .replace('.', '_')
      .replace(' ', '')
      .replace('}', '')
      .replace('{', '');
  }

  public get numColumns(): number {
    return this.columns.cardinality;
  }

  public setFds(...fds: Array<FunctionalDependency>) {
    this.fds = fds;
    this.fds = fds.filter((fd) => !fd.isFullyTrivial()); // needed?
  }

  public addFd(lhs: ColumnCombination, rhs: ColumnCombination) {
    this.fds.push(new FunctionalDependency(this, lhs, rhs));
  }

  public remainingSchema(fd: FunctionalDependency): ColumnCombination {
    return this.columns.copy().setMinus(fd.rhs).union(fd.lhs);
  }

  public generatingSchema(fd: FunctionalDependency): ColumnCombination {
    return fd.rhs.copy();
  }

  public split(fd: FunctionalDependency): Array<Table> {
    let remaining: Table = new Table(this.remainingSchema(fd).setMinus(fd.lhs));
    fd.lhs.columns.forEach((column) => remaining.columns.add(column.copy()));
    let generating: Table = new Table(this.generatingSchema(fd));

    remaining.schema = this.schema;
    generating.schema = this.schema;

    this.projectRelationships(remaining);
    this.projectRelationships(generating);

    this.projectFds(remaining);
    this.projectFds(generating);

    remaining.pk = this.pk;
    generating.pk = fd.lhs.copy();

    remaining.name = this.name;
    generating.name = fd.lhs.columnNames().join('_').substring(0, 50);

    return [remaining, generating];
  }

  public projectRelationships(table: Table): void {
    let sourceTables = table.sourceTables();
    this.relationships.forEach((relationship) => {
      if (
        sourceTables.includes(relationship.referenced().sourceTables()[0]) &&
        sourceTables.includes(relationship.referencing().sourceTables()[0])
      )
        table.relationships.push(relationship);
    });
  }

  public projectFds(table: Table): void {
    this.fds.forEach((fd) => {
      if (fd.lhs.isSubsetOf(table.columns)) {
        fd = new FunctionalDependency(
          table,
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

    let newTable = new Table(
      generating.columns
        .copy()
        .union(remaining.columns)
        .setMinus(relationship.referencing())
        .union(relationship.referenced())
    );
    newTable.schema = this.schema;
    newTable.relationships.push(...this.relationships);
    newTable.relationships.push(...otherTable.relationships);
    if (!relationship.referenced().equals(relationship.referencing()))
      newTable.relationships.push(relationship);

    newTable.name = remaining.name;
    newTable.pk = remaining.pk;

    return newTable;
  }

  public referencedTables(): Set<Table> {
    return this.schema!.fksOf(this);
  }

  public fks(): Array<[Relationship, Table]> {
    let fks = new Array<[Relationship, Table]>();
    this.schema!.fksOf(this).forEach((table) => {
      this.schema!.fksBetween(this, table).forEach((relationship) => {
        fks.push([relationship, table]);
      });
    });
    return fks;
  }

  public inds(): Array<[Relationship, Table]> {
    let inds = new Array<[Relationship, Table]>();
    this.schema!.indsOf(this).forEach((table) => {
      this.schema!.indsBetween(this, table).forEach((relationship) => {
        inds.push([relationship, table]);
      });
    });
    return inds;
  }

  public keys(): Array<ColumnCombination> {
    if (!this._keys) {
      let keys: Array<ColumnCombination> = this.fds
        .filter((fd) => fd.isKey())
        .map((fd) => fd.lhs);
      if (keys.length == 0) keys.push(this.columns.copy());
      this._keys = keys.sort((cc1, cc2) => cc1.cardinality - cc2.cardinality);
    }
    return this._keys;
  }

  public violatingFds(): Array<FunctionalDependency> {
    if (!this._violatingFds) {
      this._violatingFds = this.fds
        .filter((fd) => fd.violatesBCNF())
        .sort((fd1, fd2) => {
          return fd2.fdScore() - fd1.fdScore();
        })
        .slice(0, 100);
    }
    return this._violatingFds;
  }

  public toString(): string {
    let str = `${this.name}(${this.columns.toString()})\n`;
    str += this.fds.map((fd) => fd.toString()).join('\n');
    return str;
  }

  public toMermaidString(): string {
    let result = 'class '.concat(this.mermaidName, '{\n');
    this.columns.inOrder().forEach((column) => {
      result = result.concat(column.dataType, ' ', column.name, '\n');
    });
    result = result.concat('}');
    this.referencedTables().forEach((refTable) => {
      result = result.concat(
        '\n',
        this.mermaidName,
        ' --> ',
        refTable.mermaidName
      );
    });
    return result;
  }
}
