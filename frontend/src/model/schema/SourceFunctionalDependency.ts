import SourceColumn from './SourceColumn';

/**
 * Represents a functional dependency between columns from the database (sourceColumns).
 */
export default class SourceFunctionalDependency {
  public constructor(
    public lhs: Array<SourceColumn>,
    public rhs: Array<SourceColumn>
  ) {}
}
