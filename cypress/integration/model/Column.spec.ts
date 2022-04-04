import Column from "../../../frontend/src/model/schema/Column";
import ColumnIdentifier from "../../../frontend/src/model/schema/ColumnIdentifier";
import TableIdentifier from "../../../frontend/src/model/schema/TableIdentifier";

describe("Column", () => {
  let columnA: Column;

  beforeEach(() => {
    columnA = new Column(
      "A",
      "int",
      1,
      new ColumnIdentifier("CI1", new TableIdentifier("TI1", "public"))
    );
  });

  it("equals itself", () => {
    expect(columnA.equals(columnA)).to.equal(true);
  });

  it("creates an equal copy", () => {
    let columnACopy = columnA.copy();
    expect(columnACopy.equals(columnA)).to.equal(true);
  });
});
