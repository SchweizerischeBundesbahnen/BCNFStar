import Column from "../../../frontend/src/model/schema/Column";
import SourceColumn from "../../../frontend/src/model/schema/SourceColumn";
import SourceTable from "../../../frontend/src/model/schema/SourceTable";
import SourceTableInstance from "../../../frontend/src/model/schema/SourceTableInstance";

describe("Column", () => {
  let columnA: Column;

  beforeEach(() => {
    const sourceTable = new SourceTable("table", "schema");
    columnA = new Column(
      new SourceTableInstance(sourceTable),
      new SourceColumn("A", sourceTable, "int", false)
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
