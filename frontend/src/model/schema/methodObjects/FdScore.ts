import ColumnCombination from '../ColumnCombination';
import FunctionalDependency from '../FunctionalDependency';
import Table from '../Table';

import { InjectorInstance } from '@/src/app/app.module';
import { DatabaseService } from '@/src/app/database.service';

export default class FdScore {
  private table: Table;
  private fd: FunctionalDependency;
  protected dataService: DatabaseService;

  public constructor(table: Table, fd: FunctionalDependency) {
    this.table = table;
    this.fd = fd;

    this.dataService = InjectorInstance.get<DatabaseService>(DatabaseService);
  }

  public get(): number {
    if (!this.fd._score) {
      this.fd._score = this.calculate();
    }
    return this.fd._score;
  }

  public calculate(): number {
    //TODO: change score for fds with NULL values to zero
    return (
      (this.fdLengthScore() +
        this.keyValueScore() +
        this.fdPositionScore() +
        this.fdDensityScore() +
        this.fdRedundanceScore()) /
      5
    );
  }

  private lhsLengthScore(): number {
    return this.fd.lhs.cardinality > 0 ? 1 / this.fd.lhs.cardinality : 0;
  }

  private rhsLengthScore(): number {
    //TODO: Find out the reason for the magic number 2
    return this.table.numColumns > 2
      ? this.fd.rhs.copy().setMinus(this.fd.lhs).cardinality /
          (this.table.numColumns - 2)
      : 0;
  }

  private fdLengthScore(): number {
    return (this.lhsLengthScore() + this.rhsLengthScore()) / 2;
  }

  /**
   * 1 for keys where all key columns have values of length at most 1, less if values can be longer
   * @returns score between 0 and 1
   */
  private keyValueScore(): number {
    //TODO
    return 0;
  }

  public fdPositionScore(): number {
    return (this.lhsPositionScore() + this.rhsPositionScore()) / 2;
  }

  private lhsPositionScore(): number {
    return this.coherenceScore(this.fd.lhs);
  }

  private rhsPositionScore(): number {
    return this.coherenceScore(this.fd.rhs);
  }

  private coherenceScore(columns: ColumnCombination): number {
    return 1 / (this.numAttributesBetween(columns) + 1);
  }

  /* looks how much columns are between the columns of a column combination
  example: sorted ordinal positions of columns 1 3 4 7
  3 columns between this column combination
  because one column bewteen 1 and 3, two columns between 4 and 7 */
  public numAttributesBetween(columns: ColumnCombination): number {
    let columnsOrderByOrdinalPosition = columns.asArray().sort((col1, col2) => {
      if (col1.ordinalPosition > col2.ordinalPosition) return 1;
      return -1;
    });
    let firstColumn = columnsOrderByOrdinalPosition[0];
    let lastColumn = columnsOrderByOrdinalPosition[columns.cardinality - 1];

    let range = lastColumn.ordinalPosition - firstColumn.ordinalPosition + 1;
    return range - columns.cardinality;
  }

  public fdDensityScore(): number {
    //TODO
    return 0;
  }

  // TODO: null values
  public fdRedundanceScore(): number {
    let redundanceSum = 0;
    this.fd.redundanceGroups.forEach((num) =>
      num != 1 ? (redundanceSum += num) : redundanceSum
    );
    return redundanceSum / this.table.rowCount;
  }
}
