import ColumnCombination from '../ColumnCombination';
import FunctionalDependency from '../FunctionalDependency';
import Table from '../Table';

/**
 * COSTUMIZE YOUR RANKING:
  uses only keyValue ranking by default
  every attrubute should be >= 0 and smaller <= 1
  in sum all attributes should be 1,
  be carful with using redundance rankings, these are needing lots of database requests witch could result in long waiting times
 */
(window as any).DEFAULT_RANKING_WEIGHTS = {
  length: 0,
  keyValue: 1,
  position: 0,
  redundanceTeam: 0,
  redundanceWeiLink: 0,
  redundanceMetanome: 0,
  similarity: 0,
};

export default class FdScore {
  private table: Table;
  private fd: FunctionalDependency;

  public constructor(table: Table, fd: FunctionalDependency) {
    this.table = table;
    this.fd = fd;
  }

  /**
   * calculate the ranking score
   * @returns a ranking score that indicates how useful the fd is
   */
  public get(): number {
    if (!this.fd._score) {
      this.fd._score = this.calculate();
    }
    return this.fd._score;
  }

  /**
   * should be only used for testing
   * @returns all single scores
   */
  public testingScore() {
    return Object.fromEntries(Object.entries(this.allScores()).map(
      ([type, scoreFunction]) => [type, scoreFunction.bind(this)()]
    ))
  }

  private allScores(): Record<string, () => number> {
    return {
      length: this.fdLengthScore,
      keyValue: this.fdKeyValueScore,
      position: this.fdPositionScore,
      redundanceTeam: this.fdRedundanceScoreTeam,
      redundanceWeiLink: this.fdRedundanceScoreWeiLink,
      redundanceMetanome: this.fdRedundanceScoreMetanome,
      similarity: this.fdSimilarityScore
    };
  }

  /**
   * with window.DEFAULT_RANKING_WEIGHTS you can change the impact of each ranking
   * @returns a ranking score used different ranking approaches 
   */
  private calculate(): number {
    let score = 0
    for (const [weightName, scoreFunction] of Object.entries(this.allScores())) {
      const weight: number = (window as any).DEFAULT_RANKING_WEIGHTS[weightName] ?? 0
      if (weight !== 0) score += weight * scoreFunction.bind(this)()
    }
    return score
  }

  /**
   * 
   * @returns length score of lhs of the fd
   */
  private lhsLengthScore(): number {
    return this.fd.lhs.cardinality > 0 ? 1 / this.fd.lhs.cardinality : 0;
  }

  /**
   * -2 because the rhs can be at most (number columns of a table - 2) colums long
   * @returns length score of rhs of the fd
   */
  private rhsLengthScore(): number {
    return this.table.numColumns > 2
      ? this.fd.rhs.copy().setMinus(this.fd.lhs).cardinality /
          (this.table.numColumns - 2)
      : 0;
  }

  /**
   * 
   * @returns length score of fd
   */
  private fdLengthScore(): number {
    return (this.lhsLengthScore() + this.rhsLengthScore()) / 2;
  }

  /**
   * 1 for keys where all key columns have values of length at most 1, less if values can be longer
   * @returns key value score
   */
  private fdKeyValueScore(): number {
    let maxKeyLength = 0;
    this.fd.lhs.asArray().forEach((col) => (maxKeyLength += col.maxValue));
    return maxKeyLength == 0 ? 0 : 1 / Math.max(1, maxKeyLength - 7);
  }

  /**
   * 
   * @returns position score
   */
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

  /**
   * example: sorted ordinal positions of columns 1 3 4 7
   * 3 columns between this column combination
   * because one column bewteen 1 and 3, two columns between 4 and 7 
   * @param columns 
   * @returns how much columns are between the columns of a column combination
   */
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

  /**
   * use the unique values of the emerging table after splitting to calculate the redundance
   * @returns redundance score
   */
  private fdRedundanceScoreTeam(): number {
    return this.table.rowCount == 0
      ? 0
      : (this.table.rowCount - this.fd._uniqueTuplesLhs) / this.table.rowCount;
  }

  /**
   * use bloomfilters to estimate the unique values of columns and calculates with it the redundance score
   * @returns redundance score
   */
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

  /**
   * use sum of all redundant values of the emerging table after splitting to calculate redundance ranking
   * @returns redundance score
   */
  private fdRedundanceScoreWeiLink(): number {
    return this.table.rowCount == 0
      ? 0
      : this.fd._redundantTuples / this.table.rowCount;
  }

  /**
   * uses the similarity of all combinations of columns of lhs and rhs to calculate similarity ranking
   * @returns similarity score
   */
  private fdSimilarityScore(): number {
    const simLhs = this.averageSimilarityForCC(this.fd.lhs);
    const simRhs = this.averageSimilarityForCC(
      this.fd.rhs.copy().setMinus(this.fd.lhs)
    );
    return (simLhs + simRhs) / 2;
  }

  /**
   * 
   * @param fdSide lhs or rhs, column combination
   * @returns average similarity of one column combination
   */
  private averageSimilarityForCC(fdSide: ColumnCombination): number {
    const fdSideArray = Array.from(fdSide);

    if ((window as any).DEFAULT_RANKING_WEIGHTS.similarity == 0) return 0;
    if (fdSideArray.length == 1) return 1;

    let sumDistances = 0;
    let countDistances = 0;
    for (let i = 0; i < fdSideArray.length; i++) {
      for (let j = i + 1; j < fdSideArray.length; j++) {
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
