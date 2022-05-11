import SourceColumn from './SourceColumn';

export default class SourceRelationship {
  /**
   * these arrays are linked, the column in referencing has the same index as the
   * corresponding column in referenced
   */
  public constructor(
    public referencing = new Array<SourceColumn>(),
    public referenced = new Array<SourceColumn>()
  ) {}

  public equals(other: SourceRelationship): boolean {
    if (this == other) return true;
    if (!this.referencing[0].table.equals(other.referencing[0].table))
      return false;
    if (!this.referenced[0].table.equals(other.referenced[0].table))
      return false;
    if (this.referencing.length != other.referencing.length) return false;

    const pairs = this.referencing
      .map((column, index) => `${column.name}.${this.referenced[index].name}`)
      .sort();
    const otherPairs = other.referencing
      .map((column, index) => `${column.name}.${other.referenced[index].name}`)
      .sort();
    return pairs.every((pair, index) => pair == otherPairs[index]);
  }

  public get isTrivial(): boolean {
    for (const i in this.referencing) {
      if (!this.referencing[i].equals(this.referenced[i])) return false;
    }
    return true;
  }

  public toString(): string {
    const lhsString = this.referencing.map((col) => col.name).join(', ');
    const rhsString = this.referenced.map((col) => col.name).join(', ');

    const lhsSourceTable = this.referencing[0].table.fullName;
    const rhsSourceTable = this.referenced[0].table.fullName;

    return `(${lhsSourceTable}) ${lhsString} -> (${rhsSourceTable}) ${rhsString}`;
  }
}
