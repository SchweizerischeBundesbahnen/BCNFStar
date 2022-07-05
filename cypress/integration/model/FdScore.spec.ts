import ColumnCombination from "../../../frontend/src/model/schema/ColumnCombination";
import FunctionalDependency from "../../../frontend/src/model/schema/FunctionalDependency";
import FdScore from "../../../frontend/src/model/schema/methodObjects/FdScore";
import Table from "../../../frontend/src/model/schema/Table";

describe("FdScore", () => {
  let table: Table;

  beforeEach(() => {
    table = Table.fromColumnNames(["A", "B", "C", "D", "E"], "table1", 6);
    table.addFd(
      new FunctionalDependency(
        new ColumnCombination(table.columns.columnsFromNames("A")),
        new ColumnCombination(table.columns.columnsFromNames("B", "C"))
      )
    );
    table.addFd(
      new FunctionalDependency(
        new ColumnCombination(table.columns.columnsFromNames("A", "B")),
        new ColumnCombination(table.columns.columnsFromNames("D", "E"))
      )
    );
  });

  it("calculate correct length score", () => {
    expect(new FdScore(table, table.fds[0]).testingScore().length).to.equal(
      2 / 3
    );
    expect(new FdScore(table, table.fds[1]).testingScore().length).to.equal(
      3 / 8
    );
  });
});
