import SourceColumn from './SourceColumn';

export default class SourceFunctionalDependency {
  public constructor(
    public lhs: Array<SourceColumn>,
    public rhs: Array<SourceColumn>
  ) {}
}
