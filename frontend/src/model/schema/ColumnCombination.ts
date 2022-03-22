import Column from './Column';
import Table from './Table';

export default class ColumnCombination {
  private _columns = new Set<Column>();

  public constructor(...columns: Array<Column>) {
    this.add(...columns);
  }

  public asSet(): Set<Column> {
    return this._columns;
  }

  public asArray(): Array<Column> {
    return [...this._columns];
  }

  public copy(): ColumnCombination {
    return new ColumnCombination(...this._columns);
  }

  public columnsFromNames(...names: Array<string>) {
    return new ColumnCombination(
      ...this.asArray().filter((column: Column) => names.includes(column.name))
    );
  }

  public columnFromName(name: string) {
    return this.asArray().find((column: Column) => name.includes(column.name));
  }

  public columnsFromIds(...numbers: Array<number>) {
    return new ColumnCombination(
      ...this.inOrder().filter((col, i) => numbers.includes(i))
    );
  }

  public sourceTable(): Table {
    let sourceTables = this.sourceTables();
    if (sourceTables.length > 1)
      console.log(
        'Warning: expected only one sourceTable but there are ' +
          sourceTables.length
      );
    return sourceTables[0];
  }

  public sourceTables(): Array<Table> {
    let sourceTables = new Array<Table>();
    this._columns.forEach((column) => {
      if (!sourceTables.includes(column.sourceTable))
        sourceTables.push(column.sourceTable);
    });
    return sourceTables;
  }

  public add(...columns: Array<Column>) {
    columns.forEach((col) => {
      if (!this.includes(col)) this._columns.add(col);
    });
  }

  public delete(...columns: Array<Column>) {
    columns.forEach((column) => {
      this._columns = new Set(
        this.asArray().filter((col) => !col.equals(column))
      );
    });
  }

  public includes(column: Column): boolean {
    return this.asArray().some((col) => col.equals(column));
  }

  public get cardinality(): number {
    return this._columns.size;
  }

  public equals(other: ColumnCombination): boolean {
    return this.cardinality == other.cardinality && this.isSubsetOf(other);
  }

  public intersect(other: ColumnCombination): ColumnCombination {
    this._columns.forEach((col) => {
      if (!other.includes(col)) this.delete(col);
    });
    return this;
  }

  public union(other: ColumnCombination): ColumnCombination {
    other._columns.forEach((col) => this.add(col));
    return this;
  }

  public setMinus(other: ColumnCombination): ColumnCombination {
    other._columns.forEach((col) => this.delete(col));
    return this;
  }

  public isSubsetOf(other: ColumnCombination): boolean {
    return this.asArray().every((col) => other.includes(col));
  }

  public inOrder(): Array<Column> {
    return this.asArray().sort(
      (col1, col2) => col1.ordinalPosition - col2.ordinalPosition
    );
  }

  public columnNames(): Array<string> {
    return this.asArray()
      .sort((col1, col2) => (col1.name < col2.name ? 1 : -1))
      .map((col) => col.name);
  }

  public toString(): string {
    return this.columnNames().join(', ');
  }
}
