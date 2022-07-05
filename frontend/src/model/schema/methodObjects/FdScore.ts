import ColumnCombination from '../ColumnCombination';
import FunctionalDependency from '../FunctionalDependency';
import Table from '../Table';

export default class FdScore {
  private table: Table;
  private fd: FunctionalDependency;

  public constructor(table: Table, fd: FunctionalDependency) {
    this.table = table;
    this.fd = fd;
  }

  public get(): number {
    if (!this.fd._score) {
      this.fd._score = this.calculate();
    }
    return this.fd._score;
  }

  /**
   * should be only used for testing
   * @returns all single scores and the combination of it
   */
  public testingScore() {
    return {
      length: this.fdLengthScore(),
      keyValue: this.fdKeyValueScore(),
      position: this.fdPositionScore(),
      redundanceTeam: this.fdRedundanceScoreTeam(),
      redundanceWeiLink: this.fdRedundanceScoreWeiLink(),
      similarity: this.fdSimilarityScore(),
    };
  }

  private calculate(): number {
    // console.log("length: ", this.fdLengthScore());
    // console.log("keyvalue: ", this.fdKeyValueScore());
    // console.log("position: ", this.fdPositionScore());
    // console.log("redundance naumann: ", this.fdRedundanceScoreNaumann());
    // console.log("redundance link: ", this.fdRedundanceScoreWeiLink());
    // console.log("similarity: ", this.fdSimilarityScore());
    //TODO: change score for fds with NULL values to zero
    return (
      // (this.fdLengthScore() +
      //   this.fdKeyValueScore() +
      //   this.fdPositionScore() +
      //   this.fdRedundanceScoreTeam() +
      //   this.fdSimilarityScore()) /
      // 5
      this.fdRedundanceScoreMetanome()
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
  private fdKeyValueScore(): number {
    let maxKeyLength = 0;
    this.fd.lhs.asArray().forEach((col) => (maxKeyLength += col.maxValue));
    return maxKeyLength == 0 ? 0 : 1 / Math.max(1, maxKeyLength - 7);
  }

  private fdPositionScore(): number {
    return (this.lhsPositionScore() + this.rhsPositionScore()) / 2;
  }

  private lhsPositionScore(): number {
    return this.coherenceScore(this.fd.lhs);
  }

  private rhsPositionScore(): number {
    return this.coherenceScore(this.fd.rhs.copy().setMinus(this.fd.lhs));
  }

  private coherenceScore(columns: ColumnCombination): number {
    return 1 / (this.numAttributesBetween(columns) + 1);
  }

  /* looks how much columns are between the columns of a column combination
  example: sorted ordinal positions of columns 1 3 4 7
  3 columns between this column combination
  because one column bewteen 1 and 3, two columns between 4 and 7 */
  private numAttributesBetween(columns: ColumnCombination): number {
    const colArray = this.table.columns.asArray();
    const columnsOrderByOrdinalPosition = columns
      .asArray()
      .sort((col1, col2) => {
        if (colArray.indexOf(col1) > colArray.indexOf(col2)) return 1;
        return -1;
      });
    const firstColumn = columnsOrderByOrdinalPosition[0];
    const lastColumn = columnsOrderByOrdinalPosition[columns.cardinality - 1];

    const range =
      colArray.indexOf(lastColumn) - colArray.indexOf(firstColumn) + 1;
    return range - columns.cardinality;
  }

  private fdRedundanceScoreTeam(): number {
    // get all redundant tuples and normalize by row count
    return (
      (this.table.rowCount - this.fd._uniqueTuplesLhs) / this.table.rowCount
    );
  }

  private fdRedundanceScoreMetanome(): number {
    return (
      (this.densityScore(this.fd.lhs) +
        this.densityScore(this.fd.rhs.copy().setMinus(this.fd.lhs))) /
      2
    );
  }

  private densityScore(fdSide: ColumnCombination): number {
    let densityScore = 0;
    const fdSideArray = Array.from(fdSide);
    fdSideArray.forEach((col) => (densityScore += col.bloomFilterExpectedFpp));
    return 1 - densityScore / fdSideArray.length;
  }

  private fdRedundanceScoreWeiLink(): number {
    return this.fd._redundantTuples / this.table.rowCount;
  }

  private fdSimilarityScore(): number {
    const simLhs = this.averageSimilarityForCC(this.fd.lhs);
    const simRhs = this.averageSimilarityForCC(
      this.fd.rhs.copy().setMinus(this.fd.lhs)
    );
    // console.log(simLhs, simRhs);
    return (simLhs + simRhs) / 2;
  }

  private averageSimilarityForCC(fdSide: ColumnCombination): number {
    const fdSideArray = Array.from(fdSide);

    if (fdSideArray.length == 1) return 1;

    let sumDistances = 0;
    let countDistances = 0;
    for (let i = 0; i < fdSideArray.length; i++) {
      for (let j = i + 1; j < fdSideArray.length; j++) {
        // console.log(fdSideArray[i].name, fdSideArray[j].name);
        const key = Array.from(this.table.columnNameMatchings.keys()).find(
          (key) =>
            key.col.equals(fdSideArray[i].sourceColumn) &&
            key.otherCol.equals(fdSideArray[j].sourceColumn)
        )!;
        sumDistances += this.table.columnNameMatchings.get(key)!;
        countDistances++;
      }
    }
    return countDistances == 0 ? 0 : sumDistances / countDistances;
  }
}
