import Column from "../../../frontend/src/model/schema/Column";
import ColumnCombination from "../../../frontend/src/model/schema/ColumnCombination";
import SourceColumn from "../../../frontend/src/model/schema/SourceColumn";
import SourceTable from "../../../frontend/src/model/schema/SourceTable";
import SourceTableInstance from "../../../frontend/src/model/schema/SourceTableInstance";

describe("ColumnCombination", () => {
  let cc1: ColumnCombination;
  let cc2: ColumnCombination;

  const sourceTable = new SourceTable("table", "schema");
  const source = new SourceTableInstance(sourceTable);
  let columnA = new Column(
    source,
    new SourceColumn("A", sourceTable, "int", 1, false)
  );
  let columnB = new Column(
    source,
    new SourceColumn("B", sourceTable, "int", 1, false)
  );
  let columnC = new Column(
    source,
    new SourceColumn("C", sourceTable, "int", 1, false)
  );

  beforeEach(() => {
    cc1 = new ColumnCombination([columnA, columnB]);
    cc2 = new ColumnCombination([columnB, columnC]);
  });

  it("equals itself", () => {
    expect(cc1.equals(cc1)).to.equal(true);
  });

  it("creates an equal copy", () => {
    let cc1Copy = cc1.copy();
    expect(cc1Copy === cc1).to.equal(false);
    expect(cc1Copy.equals(cc1)).to.equal(true);
  });

  it("does not equal another ColumnCombination", () => {
    expect(cc1.equals(cc2)).to.equal(false);
  });

  it("has correct cardinality", () => {
    expect(cc1.cardinality).to.deep.equal(2);
  });

  it("calculates intersect correctly", () => {
    cc1.intersect(cc2);
    let expectedCc = new ColumnCombination([columnB]);
    expect(cc1).to.deep.equal(expectedCc);
  });

  it("calculates union correctly", () => {
    cc1.union(cc2);
    let expectedCc = new ColumnCombination([columnA, columnB, columnC]);
    expect(cc1).to.deep.equal(expectedCc);
  });

  it("calculates setminus correctly", () => {
    cc1.setMinus(cc2);
    let expectedCc = new ColumnCombination([columnA]);
    expect(cc1).to.deep.equal(expectedCc);
  });

  it("checks subset relationship correctly", () => {
    expect(cc1.isSubsetOf(cc2)).to.equal(false);
    expect(cc1.isSubsetOf(cc1.copy())).to.equal(true);
    let ccA = new ColumnCombination([columnA]);
    expect(cc1.isSubsetOf(ccA)).to.equal(false);
    expect(ccA.isSubsetOf(cc1)).to.equal(true);
  });
});
