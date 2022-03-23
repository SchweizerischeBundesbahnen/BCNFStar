import Relationship from '../Relationship';

export default class IndScore {
  private relationship: Relationship;

  public constructor(relationship: Relationship) {
    this.relationship = relationship;
  }

  public get(): number {
    if (!this.relationship._score) {
      this.relationship._score = this.calculate();
    }
    return this.relationship._score;
  }

  public calculate(): number {
    return (this.keyIdScore() + this.matchingScore()) / 2;
  }

  public keyIdScore(): number {
    let sum = 0;
    for (let cc of [
      this.relationship.referenced(),
      this.relationship.referencing(),
    ]) {
      sum += cc
        .columnNames()
        .filter(
          (name) =>
            String(name).toLowerCase().includes('key') ||
            String(name).toLowerCase().includes('id')
        ).length;
    }
    return sum / (this.relationship.referenced().cardinality * 2);
  }

  public matchingScore(): number {
    let sum = 0;
    this.relationship
      .referenced()
      .columnNames()
      .forEach((name) => {
        let minDist = 1;
        this.relationship
          .referencing()
          .columnNames()
          .forEach((name2) => {
            minDist = Math.min(minDist, this.levenshteinDistance(name, name2));
          });
        sum += 1 - minDist;
      });
    return sum / this.relationship.referenced().cardinality;
  }

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
