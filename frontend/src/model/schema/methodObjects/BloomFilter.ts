// eslint-disable-next-line no-undef
var murmurHash3 = require('murmurhash3js');

export default class BloomFilter {
  public size: number;
  public hashCount: number;
  public bitArray: Array<boolean>;

  constructor(private itemCount: number, private fpp: number) {
    this.size = this.getSize(itemCount, fpp);
    this.hashCount = this.getHashCount(this.size, itemCount);
    this.bitArray = new Array<boolean>(this.size);
    this.bitArray.forEach((pos, index) => (this.bitArray[index] = false));
  }

  private getSize(n: number, p: number): number {
    const m = (-n * Math.log(p)) / Math.log(2) ** 2;
    return Math.floor(m);
  }

  private getHashCount(m: number, n: number): number {
    const k = Math.max(1, Math.round((m / n) * Math.log(2)));
    return k;
  }

  public add(item: string) {
    let digests = [];
    for (let i = 0; i < this.hashCount; i++) {
      const digest = murmurHash3.x86.hash128(item, i) % this.size;
      digests.push(digest);
      this.bitArray[digest] = true;
    }
  }

  public approximateElementCount() {
    /**
     * Each insertion is expected to reduce the # of clear bits by a factor of
     * `numHashFunctions/bitSize`. So, after n insertions, expected bitCount is `bitSize * (1 - (1 -
     * numHashFunctions/bitSize)^n)`. Solving that for n, and approximating `ln x` as `x - 1` when x
     * is close to 1 (why?), gives the following formula.
     */
    const fractionOfBitsSet = this.settedBitInBitArray() / this.size;
    return Math.round(
      (-Math.log1p(-fractionOfBitsSet) * this.size) / this.hashCount
    );
  }

  private settedBitInBitArray(): number {
    let count = 0;
    this.bitArray.forEach((ele) => {
      if (ele) {
        count++;
      }
    });
    return count;
  }

  public expectedFpp(): number {
    return Math.pow(this.settedBitInBitArray() / this.size, this.hashCount);
  }
}
