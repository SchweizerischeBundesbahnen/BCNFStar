// eslint-disable-next-line no-undef
var murmurHash3 = require('murmurhash3js');

export default class BloomFilter {
  public size: number;
  public hashCount: number;
  public bitArray: Array<boolean>;

  /**
   * creates a bloomfilter with a specifiv size and false positive propability
   * @param itemCount items should be put into the bloomfilter
   * @param fpp false positive propability of the bloomfilter
   */
  constructor(private itemCount: number, private fpp: number) {
    this.size = this.getSize(this.itemCount, this.fpp);
    this.hashCount = this.getHashCount(this.size, this.itemCount);
    this.bitArray = new Array<boolean>(this.size);
    for (let i = 0; i < this.size; i++) {
      this.bitArray[i] = false;
    }
  }

  /** 
   * 
   * @param n items should be put into the bloomfilter
   * @param p false positive propability of the bloomfilter
   * @returns the size of the bloomfilter
   */
  private getSize(n: number, p: number): number {
    if (p <= 0) {
      p = 4.9e-324;
    }
    const m = (-n * Math.log(p)) / Math.log(2) ** 2;
    return Math.floor(m);
  }

  /**
   * 
   * @param m items should be put into the bloomfilter
   * @param n  the size of the bloomfilter
   * @returns the number hash function should be used when adding an item to the bloomfilter
   */
  private getHashCount(m: number, n: number): number {
    const k = Math.max(1, Math.round((m / n) * Math.log(2)));
    return k;
  }

  /**
   * adds an item to the bloomfilter
   * @param item should be added
   */
  public add(item: string) {
    for (let i = 0; i < this.hashCount; i++) {
      if (isNaN(parseInt(murmurHash3.x86.hash128(item, i), 16))) {
        console.log(
          'hash',
          murmurHash3.x86.hash128(item, i),
          parseInt(murmurHash3.x86.hash128(item, i), 16)
        );
        console.error('hash not a number');
      }
      const digest = parseInt(murmurHash3.x86.hash128(item, i), 16) % this.size;
      this.bitArray[digest] = true;
    }
  }

  /**
   * 
   * @returns how much bits of the bloomfilter are set
   */
  private settedBitInBitArray(): number {
    let count = 0;
    this.bitArray.forEach((ele) => {
      if (ele) {
        count++;
      }
    });
    return count;
  }

  /**
   * 
   * @returns expected false positive propability of the bloomfilter used to calculate metanome redundance ranking
   */
  public expectedFpp(): number {
    return Math.pow(this.settedBitInBitArray() / this.size, this.hashCount);
  }
}
