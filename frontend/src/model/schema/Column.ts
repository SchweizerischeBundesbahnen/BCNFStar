import IAttribute from '@server/definitions/IAttribute';
import SourceColumn from './SourceColumn';
import SourceTableInstance from './SourceTableInstance';

/**
 * These objects uniquely identify a column within a table.
 * Be careful when using them outside the context of a table
 */
export default class Column {
  public includeSourceName = false;

  public constructor(
    public sourceTableInstance: SourceTableInstance,
    public sourceColumn: SourceColumn,
    public userAlias?: string
  ) {}

  public get name() {
    let name = '';
    if (this.includeSourceName) name += `${this.sourceTableInstance.alias}_`;
    name += this.baseAlias;
    return name;
  }

  public get identifier() {
    return `${this.sourceTableInstance.alias}.${this.sourceColumn.name}`;
  }

  public get baseAlias(): string {
    return this.userAlias ?? this.sourceColumn.name;
  }

  public copy(): Column {
    return new Column(
      this.sourceTableInstance,
      this.sourceColumn,
      this.userAlias
    );
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
    if (this == other) return true;
    return (
      this.sourceTableInstance.equals(other.sourceTableInstance) &&
      this.sourceColumn.equals(other.sourceColumn)
    );
  }

  public applySourceMapping(
    mapping: Map<SourceTableInstance, SourceTableInstance>
  ): Column {
    return new Column(
      mapping.get(this.sourceTableInstance) || this.sourceTableInstance,
      this.sourceColumn,
      this.userAlias
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
