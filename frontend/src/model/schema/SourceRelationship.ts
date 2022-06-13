import SourceColumn from './SourceColumn';
import { IRel } from './methodObjects/FkDerivation';

export default class SourceRelationship
  implements IRel<SourceRelationship, SourceColumn>
{
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

  public mapsColumns(
    referencingCol: SourceColumn,
    referencedCol: SourceColumn
  ): boolean {
    const i = this.referencing.findIndex((otherReferencingCol) =>
      otherReferencingCol.equals(referencingCol)
    );
    if (i == -1) return false;
    return this.referenced[i].equals(referencedCol);
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

  isConnected(other: SourceRelationship): boolean {
    for (const col of other.referencing) {
      if (!this.referenced.some((otherCol) => otherCol.equals(col)))
        return false;
    }
    return true;
  }

  public get referencingCols(): SourceColumn[] {
    return this.referencing;
  }

  public get referencedCols(): SourceColumn[] {
    return this.referenced;
  }
}
