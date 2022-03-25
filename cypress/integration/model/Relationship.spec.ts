import ColumnCombination from "../../../frontend/src/model/schema/ColumnCombination";
import Relationship from "../../../frontend/src/model/schema/Relationship";
import Table from "../../../frontend/src/model/schema/Table";

describe("Relationship", () => {
  let table1: Table;
  let table2: Table;
  let relationship: Relationship;

  beforeEach(() => {
    table1 = Table.fromColumnNames("A", "B", "C");
    table2 = Table.fromColumnNames("D", "E", "F");
  });

  it("creates relationship from two tables correctly", () => {
    let columnD = table2.columns.columnFromName("D")!;
    table1.columns.add(columnD);
    relationship = Relationship.fromTables(table1, table2);
    expect(relationship.referenced()).to.deep.equal(
      new ColumnCombination(columnD)
    );
    expect(relationship.referencing()).to.deep.equal(
      new ColumnCombination(columnD)
    );
  });

  it("checks whether it applies to two tables correctly", () => {
    relationship = new Relationship();
    relationship.add(
      table1.columns.columnFromName("A")!,
      table2.columns.columnFromName("D")!
    );
    expect(relationship.appliesTo(table1, table2)).to.equal(true);
    expect(relationship.appliesTo(table2, table1)).to.equal(false);
    expect(relationship.appliesTo(table1, new Table())).to.equal(false);
  });
});
