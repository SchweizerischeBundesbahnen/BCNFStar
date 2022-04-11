import IAttribute from '@server/definitions/IAttribute';
import SourceColumn from './SourceColumn';
import SourceTableInstance from './SourceTableInstance';

export default class Column {
  public name;

  public constructor(
    public sourceTable: SourceTableInstance,
    public sourceColumn: SourceColumn,
    name?: string
  ) {
    this.name = name ? name : sourceColumn.name;
  }

  public copy(): Column {
    return new Column(this.sourceTable, this.sourceColumn, this.name);
  }

  public get dataType() {
    return this.sourceColumn.dataType;
  }

  public get nullable() {
    return this.sourceColumn.nullable;
  }

  public get ordinalPosition() {
    return this.sourceColumn.ordinalPosition;
  }

  public dataTypeString() {
    return `(${this.dataType}, ${this.nullable == true ? 'null' : 'not null'})`;
  }

  public equals(other: Column): boolean {
    return (
      this.sourceColumn.name == other.sourceColumn.name &&
      this.sourceColumn.table.name == other.sourceColumn.table.name &&
      this.sourceColumn.table.schemaName == other.sourceColumn.table.schemaName
    );
  }
  public toIAttribute(): IAttribute {
    return {
      name: this.name,
      table: this.sourceColumn.table.name,
      dataType: this.dataType,
      nullable: this.nullable,
    };
  }
}
