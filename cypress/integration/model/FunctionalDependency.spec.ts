import Table from "../../../frontend/src/model/schema/Table";

describe("FunctionalDependency", () => {
  let table: Table;

  beforeEach(() => {
    table = Table.fromColumnNames(["A", "B", "C", "D"], "table1");
    table.addFd(
      table.columns.columnsFromNames("A"),
      table.columns.columnsFromNames("B", "C")
    );
    table.addFd(
      table.columns.columnsFromNames("A"),
      table.columns.columnsFromNames("A")
    );
  });

  it("extends correctly", () => {
    table.addFd(
      table.columns.columnsFromNames("A"),
      table.columns.columnsFromNames("B", "C")
    );
    expect(
      table.fds[0].lhs.equals(table.columns.columnsFromNames("A"))
    ).to.equals(true);
    expect(
      table.fds[0].rhs.equals(table.columns.columnsFromNames("A", "B", "C"))
    ).to.equal(true);
  });

  it("checks full triviality correctly", () => {
    expect(table.fds[0].isFullyTrivial()).to.equal(false);
    expect(table.fds[1].isFullyTrivial()).to.equal(true);
  });
});
