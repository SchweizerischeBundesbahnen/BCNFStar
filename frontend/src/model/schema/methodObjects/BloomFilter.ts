// eslint-disable-next-line no-undef
var murmurHash3 = require('murmurhash3js');

export default class BloomFilter {
  public size: number;
  public hashCount: number;
  public bitArray: Array<boolean>;

  constructor(private itemCount: number, private fpp: number) {
    this.size = this.getSize(this.itemCount, this.fpp);
    this.hashCount = this.getHashCount(this.size, this.itemCount);
    this.bitArray = new Array<boolean>(this.size);
    for (let i = 0; i < this.size; i++) {
      this.bitArray[i] = false;
    }
  }

  private getSize(n: number, p: number): number {
    if (p <= 0) {
      p = 4.9e-324;
    }
    const m = (-n * Math.log(p)) / Math.log(2) ** 2;
    return Math.floor(m);
  }

  private getHashCount(m: number, n: number): number {
    const k = Math.max(1, Math.round((m / n) * Math.log(2)));
    return k;
  }

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
    console.log(
      'count: ',
      this.settedBitInBitArray(),
      'bitarray: ',
      this.bitArray
    );
    return Math.pow(this.settedBitInBitArray() / this.size, this.hashCount);
  }
}
