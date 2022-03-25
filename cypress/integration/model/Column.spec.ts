import Column from "../../../frontend/src/model/schema/Column";
import Table from "../../../frontend/src/model/schema/Table";

describe("Column", () => {
  let columnA: Column;

  beforeEach(() => {
    columnA = new Column("A", "int", 1, new Table());
  });

  it("equals itself", () => {
    expect(columnA.equals(columnA)).to.equal(true);
  });

  it("creates an equal copy", () => {
    let columnACopy = columnA.copy();
    expect(columnACopy.equals(columnA)).to.equal(true);
  });
});
