import BasicColumn from '../types/BasicColumn';
import { ConstraintPolicy } from '../types/ConstraintPolicy';

/**
 * Abstract base class for Table and UnionedTable.
 * Use Schema.displayedColumnsOf(BasicTable) to get the columns that should be displayed in the schema graph.
 */
export default abstract class BasicTable {
  public name = '';
  public schemaName = '';

  public isSuggestedFact = false;
  public isRejectedFact = false;

  /**
   * returns the name of the table in the format "{schemaName}.{tableName}"
   */
  public get fullName(): string {
    return this.schemaName + '.' + this.name;
  }

  /**
   * returns whether the specified column should be nullable in the exported schema.
   */
  public abstract nullConstraintFor(
    column: BasicColumn,
    constraintPolicy: ConstraintPolicy
  ): boolean;
}
