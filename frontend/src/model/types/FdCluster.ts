import ColumnCombination from '../schema/ColumnCombination';
import FunctionalDependency from '../schema/FunctionalDependency';

export interface FdCluster {
  columns: ColumnCombination;
  fds: Array<FunctionalDependency>;
}
