import BloomFilter from "../../../frontend/src/model/schema/methodObjects/BloomFilter";

describe("Bloomfilter", () => {
  let bloomFilter;
  beforeEach(() => {
    bloomFilter = new BloomFilter(20, 0.05);
  });

  it("sets attributes correct", () => {
    expect(bloomFilter.size).to.equal(124);
    expect(bloomFilter.fpp).to.equal(0.05);
    expect(bloomFilter.hashCount).to.equal(4);
  });

  it("adds strings", () => {
    bloomFilter.add("Mona");
    bloomFilter.add("Ronja");
    bloomFilter.add("Tom");
    bloomFilter.add("Janina");
    bloomFilter.add("Tobi");
    bloomFilter.add("Paul");
    bloomFilter.add("Chris");
    bloomFilter.add("Marie");
    bloomFilter.add("Maria");
    bloomFilter.add("Katja");
    bloomFilter.add("Youri");
    bloomFilter.add("Felix");
    bloomFilter.add("Lara");
    bloomFilter.add("Tanja");
    bloomFilter.add("Lili");
    bloomFilter.add("Katharina");
    bloomFilter.add("Gerhard");
    bloomFilter.add("Christin");
    bloomFilter.add("Dana");
    bloomFilter.add("Daniele");
    bloomFilter.add("Luna");
    bloomFilter.add("Kiara");

    expect(bloomFilter.expectedFpp()).to.equal(0.0029916118921497177);
  });
});
