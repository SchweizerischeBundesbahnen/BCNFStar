import { DatabaseService } from '@/src/app/database.service';
import IINDScoreMetadata from '@server/definitions/IINDScoreMetadata';
import IINDScoreMetadataRequestBody from '@server/definitions/IINDScoreMetadataRequestBody';
import { IColumnRelationship } from '@server/definitions/IRelationship';
import ITable from '@server/definitions/ITable';
import ColumnCombination from '../ColumnCombination';
import SourceRelationship from '../SourceRelationship';

export default class IndScore {
  private rel: SourceRelationship;
  protected dataService: DatabaseService;

  public constructor(
    relationship: SourceRelationship,
    dbService: DatabaseService
  ) {
    this.rel = relationship;
    this.dataService = dbService;
  }

  public async get(): Promise<number> {
    if (!this.rel.relationship._score) {
      this.rel.relationship._score = await this.calculate();
    }
    return this.rel.relationship._score;
  }

  public async calculate(): Promise<number> {
    let iTableReferencing: ITable = {
      name: this.rel.referencingCols[0].table.name,
      schemaName: this.rel.referencingCols[0].table.schemaName,
      attributes: [],
    };
    let iTableReferenced: ITable = {
      name: this.rel.referencedCols[0].table.name,
      schemaName: this.rel.referencedCols[0].table.schemaName,
      attributes: [],
    };
    let colRels: IColumnRelationship[] = this.rel.relationship.referencing.map(
      (col, i) => {
        return {
          referencingColumn: col.name,
          referencedColumn: this.rel.relationship.referenced[i].name,
        } as IColumnRelationship;
      }
    );
    let body: IINDScoreMetadataRequestBody = {
      tableReferencing: iTableReferencing,
      tableReferenced: iTableReferenced,
      columnRelationships: colRels,
    };
    let indScoreMetadata: IINDScoreMetadata =
      await this.dataService.getINDScoreMetadata(body);
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
      new ColumnCombination(this.rel.relationship.referenced),
      new ColumnCombination(this.rel.relationship.referencing),
    ]) {
      sum += cc
        .columnNames()
        .filter(
          (name) =>
            String(name).toLowerCase().includes('key') ||
            String(name).toLowerCase().includes('id')
        ).length;
    }
    return sum / (this.rel.relationship.referenced.length * 2);
  }

  /**
   * Minimal distances of each referenced-column to the referencing-columns
   * standardized to (0,1)
   */
  public matchingScore(): number {
    let sum = 0;
    new ColumnCombination(this.rel.relationship.referenced)
      .columnNames()
      .forEach((name) => {
        let minDist = 1;
        new ColumnCombination(this.rel.relationship.referencing)
          .columnNames()
          .forEach((name2) => {
            minDist = Math.min(minDist, this.levenshteinDistance(name, name2));
          });
        sum += 1 - minDist;
      });
    return sum / this.rel.relationship.referenced.length;
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
