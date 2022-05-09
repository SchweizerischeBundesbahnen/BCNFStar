import SourceColumn from './SourceColumn';

export default class SourceFunctionalDependency {
  public constructor(
    public lhs: Array<SourceColumn>,
    public rhs: Array<SourceColumn>
  ) {}

  public equals(other: SourceFunctionalDependency): boolean {
    if (this == other) return true;
    for (let i = 0; i < Math.min(this.lhs.length, other.lhs.length); i++) {
      if (!this.lhs[i].equals(other.lhs[i])) return false;
    }
    for (let i = 0; i < Math.min(this.rhs.length, other.rhs.length); i++) {
      if (!this.rhs[i].equals(other.rhs[i])) return false;
    }
    return true;
  }
}
