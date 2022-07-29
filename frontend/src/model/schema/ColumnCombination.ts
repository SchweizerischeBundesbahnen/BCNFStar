import Column from './Column';
import SourceColumn from './SourceColumn';
import SourceTableInstance from './SourceTableInstance';

/**
 * A collection of columns. It offers set operations and other methods for convenience.
 */
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

  public columnsByNames(...names: Array<string>): Array<Column> {
    return names.map((name) => this.columnByName(name));
  }

  public columnByName(name: string): Column {
    const result = this.asArray().find((column) => name.includes(column.name));
    if (!result) console.error('column with name ' + name + ' not found');
    return result!;
  }

  public columnsByIds(...numbers: Array<number>): ColumnCombination {
    return new ColumnCombination(
      this.asArray().filter((col, i) => numbers.includes(i))
    );
  }

  /**
   * Should only be called on collections of columns with the same sourceTableInstance. It returns this sourceTableInstance.
   */
  public sourceTableInstance(): SourceTableInstance {
    let sources = this.sourceTableInstances();
    if (sources.length > 1)
      console.warn(
        'Warning: expected only one SourceTableInstance but there are ' +
          sources.length
      );
    return sources[0];
  }

  /**
   * Returns all sourceTableInstances of the contained columns.
   */
  public sourceTableInstances(): Array<SourceTableInstance> {
    let sources = new Array<SourceTableInstance>();
    this._columns.forEach((column) => {
      if (!sources.includes(column.sourceTableInstance))
        sources.push(column.sourceTableInstance);
    });
    return sources;
  }

  /**
   * Tries to find columns whose sourceColumns are the equal to the given ones. Returns the ones that are found.
   * If findAll is set to true, all sourceColumns must be found or the return value is null.
   */
  public columnsEquivalentTo(
    sourceColumns: Array<SourceColumn>,
    findAll: boolean
  ): Array<Column> | null {
    const equivalentColumns = new Array<Column>();
    for (const sourceColumn of sourceColumns) {
      let equivalentColumn = this.asArray().find((column) =>
        column.sourceColumn.equals(sourceColumn)
      );
      if (findAll && !equivalentColumn) return null;
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

  public columnNames(): Array<string> {
    return this.asArray().map((col) => col.name);
  }

  public sourceColumnNames(): Array<string> {
    return this.asArray().map((col) => col.sourceColumn.name);
  }

  public toString(): string {
    return this.columnNames().join(', ');
  }

  /**
   * Returns a copy of this columnCombination where all sourceTableInstances of the contained columns are replaced according to the mapping.
   */
  public applySourceMapping(
    mapping: Map<SourceTableInstance, SourceTableInstance>
  ): ColumnCombination {
    return new ColumnCombination(
      this._columns.map((column) => column.applySourceMapping(mapping))
    );
  }

  /**
   * Replaces columns within the collection according to the mapping.
   */
  public columnSubstitution(mapping: Map<Column, Column>) {
    this._columns = this._columns.map(
      (column) => mapping.get(column) || column
    );
    return this;
  }
}
