import IAttribute from '@server/definitions/IAttribute';
import BasicColumn from '../types/BasicColumn';
import SourceColumn from './SourceColumn';
import SourceTableInstance from './SourceTableInstance';
import BloomFilter from './methodObjects/BloomFilter';

/**
 * These objects uniquely identify a column within a table.
 * Be careful when using them outside the context of a table
 */
export default class Column implements BasicColumn {
  public includeSourceName = false;
  private _maxValue = 0;
  private _bloomFilterExpectedFpp: number = 0;

  public constructor(
    public sourceTableInstance: SourceTableInstance,
    public sourceColumn: SourceColumn,
    public userAlias?: string
  ) {}

  public get bloomFilterExpectedFpp() {
    return this._bloomFilterExpectedFpp;
  }

  public setBloomFilterFpp(sample: Array<string>) {
    console.log(this.name, sample);
    let bf = new BloomFilter(1000, 0.5);
    sample.forEach((e) => bf.add(e));

    this._bloomFilterExpectedFpp = bf.expectedFpp();
  }

  public get maxValue() {
    return this._maxValue;
  }

  public set maxValue(num: number) {
    this._maxValue = num;
  }

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
    let col = new Column(
      this.sourceTableInstance,
      this.sourceColumn,
      this.userAlias
    );
    // for value ranking, sufficient to update maxValues after splitting
    col.maxValue = this._maxValue;
    return col;
  }

  public get dataType() {
    return this.sourceColumn.dataType;
  }

  public get nullable() {
    return this.sourceColumn.nullable;
  }

  public get dataTypeString() {
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
