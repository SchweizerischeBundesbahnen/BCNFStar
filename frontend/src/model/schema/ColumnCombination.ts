import Column from './Column';
import SourceColumn from './SourceColumn';
import SourceTableInstance from './SourceTableInstance';

export default class ColumnCombination {
  private _columns: Array<Column> = [];

  public constructor(columns?: Array<Column>) {
    this._columns = columns || new Array();
  }

  [Symbol.iterator]() {
    return this._columns[Symbol.iterator]();
  }

  public asArray(): Array<Column> {
    return this._columns;
  }

  public copy(): ColumnCombination {
    return new ColumnCombination(new Array(...this._columns));
  }

  public columnsFromNames(...names: Array<string>) {
    return new ColumnCombination(
      this.asArray().filter((column: Column) => names.includes(column.name))
    );
  }

  public columnFromName(name: string) {
    return this.asArray().find((column: Column) => name.includes(column.name));
  }

  public columnsFromIds(...numbers: Array<number>) {
    return new ColumnCombination(
      this.inOrder().filter((col, i) => numbers.includes(i))
    );
  }

  public sourceTableInstance(): SourceTableInstance {
    let sourceTables = this.sourceTableInstances();
    if (sourceTables.length > 1)
      console.warn(
        'Warning: expected only one sourceTable but there are ' +
          sourceTables.length
      );
    return sourceTables[0];
  }

  public sourceTableInstances(): Array<SourceTableInstance> {
    let sourceTables = new Array<SourceTableInstance>();
    this._columns.forEach((column) => {
      if (!sourceTables.includes(column.sourceTableInstance))
        sourceTables.push(column.sourceTableInstance);
    });
    return sourceTables;
  }

  public columnsEquivalentTo(
    sourceColumns: Array<SourceColumn>,
    findAll: boolean
  ) {
    const equivalentColumns = new Array<Column>();
    for (const sourceColumn of sourceColumns) {
      let equivalentColumn = this.asArray().find((column) =>
        column.sourceColumn.equals(sourceColumn)
      );
      if (findAll && !equivalentColumn) return undefined;
      if (equivalentColumn) equivalentColumns.push(equivalentColumn);
    }
    return equivalentColumns;
  }

  public add(...columns: Array<Column>) {
    columns.forEach((col) => {
      if (!this.includes(col)) this._columns.push(col);
    });
  }

  public delete(...columns: Array<Column>) {
    this._columns = this._columns.filter(
      (col) => !columns.some((deleteCol) => deleteCol.equals(col))
    );
  }

  public includes(column: Column): boolean {
    return this.asArray().some((col) => col.equals(column));
  }

  public get cardinality(): number {
    return this._columns.length;
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
    this.add(...other._columns);
    return this;
  }

  public setMinus(other: ColumnCombination): ColumnCombination {
    this.delete(...other._columns);
    return this;
  }

  public isSubsetOf(other: ColumnCombination): boolean {
    return this.asArray().every((col) => other.includes(col));
  }

  public inOrder(): Array<Column> {
    return this.asArray().sort((col1, col2) => {
      if (col1.sourceColumn.table.fullName == col2.sourceColumn.table.fullName)
        return col1.ordinalPosition - col2.ordinalPosition;
      // Todo: make sure most important tables are on top, not just alphabetically
      if (col1.sourceColumn.table.name < col2.sourceColumn.table.name) return 1;
      else return -1;
    });
  }

  public columnNames(): Array<string> {
    return this.inOrder().map((col) => col.name);
  }

  public toString(): string {
    return this.columnNames().join(', ');
  }

  public applySourceMapping(
    mapping: Map<SourceTableInstance, SourceTableInstance>
  ): ColumnCombination {
    return new ColumnCombination(
      this._columns.map((column) => column.applySourceMapping(mapping))
    );
  }

  public columnSubstitution(mapping: Map<Column, Column>) {
    this._columns = this._columns.map(
      (column) => mapping.get(column) || column
    );
    return this;
  }
}
