import Relationship from "../../../frontend/src/model/schema/Relationship";
import Table from "../../../frontend/src/model/schema/Table";

describe("Relationship", () => {
  let table1: Table;
  let table2: Table;
  let relationship: Relationship;

  beforeEach(() => {
    table1 = Table.fromColumnNames(["A", "B1", "C1"], "table1", 0);
    table2 = Table.fromColumnNames(["B2", "C2", "D"], "table2", 0);
    relationship = new Relationship(
      table1.columns.columnsFromNames("B1", "C1"),
      table2.columns.columnsFromNames("B2", "C2")
    );
  });

  it("checks equality correctly", () => {
    const otherTable1 = Table.fromColumnNames(["A", "B1", "C1"], "table1", 0);
    const otherTable2 = Table.fromColumnNames(["B2", "C2", "D"], "table2", 0);
    const otherRelationship = new Relationship(
      otherTable1.columns.columnsFromNames("B1", "C1"),
      otherTable2.columns.columnsFromNames("B2", "C2")
    );
    expect(relationship.equals(otherRelationship)).to.equal(true);
  });
});
