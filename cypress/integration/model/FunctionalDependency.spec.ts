import Column from "../../../frontend/src/model/schema/Column";
import ColumnCombination from "../../../frontend/src/model/schema/ColumnCombination";
import FunctionalDependency from "../../../frontend/src/model/schema/FunctionalDependency";
import Table from "../../../frontend/src/model/schema/Table";

describe("FunctionalDependency", () => {
  let table: Table;

  beforeEach(() => {
    table = Table.fromColumnNames(["A", "B", "C", "D"], "table1", 0);
    table.addFd(
      new FunctionalDependency(
        new ColumnCombination(table.columns.columnsFromNames("A")),
        new ColumnCombination(table.columns.columnsFromNames("B", "C"))
      )
    );
    table.addFd(
      new FunctionalDependency(
        new ColumnCombination(table.columns.columnsFromNames("A")),
        new ColumnCombination(table.columns.columnsFromNames("A"))
      )
    );
  });

  it("extends correctly", () => {
    expect(
      table.fds[0].rhs.equals(
        new ColumnCombination(table.columns.columnsFromNames("A", "B", "C"))
      )
    ).to.equal(true);
  });

  it("checks full triviality correctly", () => {
    expect(table.fds[0].isFullyTrivial()).to.equal(false);
    expect(table.fds[1].isFullyTrivial()).to.equal(true);
  });
});
