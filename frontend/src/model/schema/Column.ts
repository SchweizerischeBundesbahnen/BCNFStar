import IAttribute from '@server/definitions/IAttribute';
import ColumnIdentifier from './ColumnIdentifier';

export default class Column {
  name: string;
  dataType: string;
  ordinalPosition: number;
  nullable: boolean;
  source: ColumnIdentifier;

  public constructor(
    name: string,
    dataType: string,
    ordinalPosition: number,
    nullable: boolean,
    source: ColumnIdentifier
  ) {
    this.name = name;
    this.dataType = dataType;
    this.ordinalPosition = ordinalPosition;
    this.nullable = nullable;
    this.source = source;
  }

  public copy(): Column {
    return new Column(
      this.name,
      this.dataType,
      this.ordinalPosition,
      this.nullable,
      this.source
    );
  }

  public dataTypeString() {
    return `(${this.dataType}, ${this.nullable == true ? 'null' : 'not null'})`;
  }

  public equals(other: Column): boolean {
    return (
      this.source.name == other.source.name &&
      this.source.table.name == other.source.table.name &&
      this.source.table.schemaName == other.source.table.schemaName
    );
  }
  public toIAttribute(): IAttribute {
    return {
      name: this.name,
      table: this.source.table.name,
      dataType: this.dataType,
      nullable: this.nullable,
    };
  }
}
