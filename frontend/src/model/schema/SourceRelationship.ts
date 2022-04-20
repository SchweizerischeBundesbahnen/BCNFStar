import SourceColumn from './SourceColumn';

export default class SourceRelationship {
  // these arrays are linked, the column in _referencing has the same index as the
  // corresponding column in _referenced
  public referencing = new Array<SourceColumn>();
  public referenced = new Array<SourceColumn>();

  public equals(other: SourceRelationship): boolean {
    if (this == other) return true;
    if (!this.referencing[0].table.equals(other.referencing[0].table))
      return false;
    if (!this.referenced[0].table.equals(other.referenced[0].table))
      return false;
    if (this.referencing.length != other.referencing.length) return false;
    const pairs = [...Array(this.referencing.length).keys()].map(
      (i) => `${this.referencing[i].name}#${this.referenced[i].name}`
    );
    const otherPairs = [...Array(other.referencing.length).keys()].map(
      (i) => `${other.referencing[i].name}#${other.referenced[i].name}`
    );
    return pairs.every((pair) => otherPairs.includes(pair));
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
    return `${lhsString} -> ${rhsString}`;
  }
}
