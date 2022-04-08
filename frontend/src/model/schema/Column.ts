import IAttribute from '@server/definitions/IAttribute';
import SourceColumn from './SourceColumn';

export default class Column {
  public constructor(public name: string, public source: SourceColumn) {}

  public copy(): Column {
    return new Column(this.name, this.source);
  }

  public get dataType() {
    return this.source.dataType;
  }

  public get nullable() {
    return this.source.nullable;
  }

  public get ordinalPosition() {
    return this.source.ordinalPosition;
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
