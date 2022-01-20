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
    this.fds = fds.filter((fd) => !fd.isFullyTrivial());
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

  public split(
    fd: FunctionalDependency,
    relationship: Relationship
  ): Array<Table> {
    let remaining: Table = new Table(this.remainingSchema(fd));
    let generating: Table = new Table(this.generatingSchema(fd));

    remaining.schema = this.schema;
    generating.schema = this.schema;

    this.projectFds(remaining);
    this.projectFds(generating);

    relationship.referencedToReferencingColumnsIn(remaining.columns);
    remaining.fds.forEach((fd) => {
      relationship.referencedToReferencingColumnsIn(fd.lhs);
      relationship.referencedToReferencingColumnsIn(fd.rhs);
    });

    remaining.pk = this.pk;
    generating.pk = fd.lhs.copy();

    remaining.name = this.name;
    generating.name = fd.lhs.columnNames().join('_').substring(0, 50);

    return [remaining, generating];
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
    let newTable = new Table(
      this.columns
        .copy()
        .union(otherTable.columns)
        .setMinus(relationship.referencing())
    );
    newTable.schema = this.schema;

    let remaining: Table;
    if (this.referencedTables().has(otherTable)) {
      remaining = this;
    } else {
      remaining = otherTable;
    }

    newTable.name = remaining.name;
    newTable.pk = remaining.pk;

    return newTable;
  }

  public referencedTables(): Set<Table> {
    return this.schema!.referencedTablesOf(this);
  }

  public foreignKeyForReferencedTable(
    refTable: Table
  ): ColumnCombination | undefined {
    return this.schema!.foreignKeyBetween(this, refTable);
  }

  public keys(): Array<ColumnCombination> {
    let keys: Array<ColumnCombination> = this.fds
      .filter((fd) => fd.isKey())
      .map((fd) => fd.lhs);
    if (keys.length == 0) keys.push(this.columns.copy());
    return keys.sort((cc1, cc2) => cc1.cardinality - cc2.cardinality);
  }

  public foreignKeys(): Array<ColumnCombination> {
    let foreignKeys: Array<ColumnCombination> = [];
    this.referencedTables().forEach((table) => {
      foreignKeys.push(this.foreignKeyForReferencedTable(table)!);
    });
    return foreignKeys;
  }

  public violatingFds(): Array<FunctionalDependency> {
    return this.fds
      .filter((fd) => fd.violatesBCNF())
      .sort((fd1, fd2) => {
        return fd2.fdScore() - fd1.fdScore();
      });
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
