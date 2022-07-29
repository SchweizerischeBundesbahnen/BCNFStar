import ColumnCombination from '../schema/ColumnCombination';
import FunctionalDependency from '../schema/FunctionalDependency';

/**
 * A set of functional dependencies, that all share the same right hand side.
 * When splitting a table on any of these functional dependencies,
 * the resulting two tables will structurally be the same,
 * apart from different primary keys / foreign keys.
 */
export interface FdCluster {
  /**
   * The shared right hand side of all functional dependencies.
   */
  columns: ColumnCombination;
  fds: Array<FunctionalDependency>;
}
