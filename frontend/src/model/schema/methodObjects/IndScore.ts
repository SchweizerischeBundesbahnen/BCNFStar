import { InjectorInstance } from '@/src/app/app.module';
import { DatabaseService } from '@/src/app/database.service';
import IINDScoreMetadata from '@server/definitions/IINDScoreMetadata';
import ColumnCombination from '../ColumnCombination';
import Relationship from '../Relationship';

export default class IndScore {
  private relationship: Relationship;
  protected dataService: DatabaseService;

  public constructor(relationship: Relationship) {
    this.relationship = relationship;
    this.dataService = InjectorInstance.get<DatabaseService>(DatabaseService);
  }

  public async get(): Promise<number> {
    if (!this.relationship._score) {
      this.relationship._score = await this.calculate();
    }
    return this.relationship._score;
  }

  public async calculate(): Promise<number> {
    let indScoreMetadata: IINDScoreMetadata =
      await this.dataService.getINDScoreMetadata();
    return Number(
      this.keyIdScore() +
        this.matchingScore() +
        indScoreMetadata.coverage +
        indScoreMetadata.distinctDependantValues +
        indScoreMetadata.outOfRange +
        indScoreMetadata.tableSizeRatio +
        indScoreMetadata.valueLengthDiff
    );
  }

  /**
   * Fraction of columns whose name contains "key" or "id"
   */
  public keyIdScore(): number {
    let sum = 0;
    for (let cc of [
      new ColumnCombination(this.relationship.referenced),
      new ColumnCombination(this.relationship.referencing),
    ]) {
      sum += cc
        .columnNames()
        .filter(
          (name) =>
            String(name).toLowerCase().includes('key') ||
            String(name).toLowerCase().includes('id')
        ).length;
    }
    return sum / (this.relationship.referenced.length * 2);
  }

  /**
   * Minimal distances of each referenced-column to the referencing-columns
   * standardized to (0,1)
   */
  public matchingScore(): number {
    let sum = 0;
    new ColumnCombination(this.relationship.referenced)
      .columnNames()
      .forEach((name) => {
        let minDist = 1;
        new ColumnCombination(this.relationship.referencing)
          .columnNames()
          .forEach((name2) => {
            minDist = Math.min(minDist, this.levenshteinDistance(name, name2));
          });
        sum += 1 - minDist;
      });
    return sum / this.relationship.referenced.length;
  }

  /**
   * Distance of two strings
   * Code taken from https://www.30secondsofcode.org/js/s/levenshtein-distance
   * Scaled to (0,1)
   */
  private levenshteinDistance(string1: string, string2: string): number {
    if (!string1.length) return string2.length;
    if (!string2.length) return string1.length;
    const arr = [];
    for (let i = 0; i <= string2.length; i++) {
      arr[i] = [i];
      for (let j = 1; j <= string1.length; j++) {
        arr[i][j] =
          i === 0
            ? j
            : Math.min(
                arr[i - 1][j] + 1,
                arr[i][j - 1] + 1,
                arr[i - 1][j - 1] + (string1[j - 1] === string2[i - 1] ? 0 : 1)
              );
      }
    }
    return (
      arr[string2.length][string1.length] /
      Math.max(string1.length, string2.length)
    );
  }
}
