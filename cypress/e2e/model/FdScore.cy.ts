import ColumnCombination from "../../../frontend/src/model/schema/ColumnCombination";
import FunctionalDependency from "../../../frontend/src/model/schema/FunctionalDependency";
import FdScore from "../../../frontend/src/model/schema/methodObjects/FdScore";
import Table from "../../../frontend/src/model/schema/Table";

describe("FdScore", () => {
  let table: Table;

  beforeEach(() => {
    (window as any).DEFAULT_RANKING_WEIGHTS = {
      length: 1 / 7,
      keyValue: 1 / 7,
      position: 1 / 7,
      redundanceTeam: 1 / 7,
      redundanceWeiLink: 1 / 7,
      redundanceMetanome: 1 / 7,
      similarity: 1 / 7,
    };

    table = Table.fromColumnNames(
      ["p_A", "p_B", "c_C", "c_D", "c_E"],
      "table1",
      5
    );
    let fd1 = new FunctionalDependency(
      new ColumnCombination(table.columns.columnsByNames("p_A")),
      new ColumnCombination(table.columns.columnsByNames("p_B", "c_C"))
    );
    fd1._uniqueTuplesLhs = 3;
    fd1._redundantTuples = 4;
    table.addFd(fd1);

    let fd2 = new FunctionalDependency(
      new ColumnCombination(table.columns.columnsByNames("p_B", "c_C")),
      new ColumnCombination(table.columns.columnsByNames("p_A", "c_D", "c_E"))
    );
    fd2._uniqueTuplesLhs = 5;
    fd2._redundantTuples = 0;
    table.addFd(fd2);

    Array.from(table.columns)[0].maxValue = 3;
    Array.from(table.columns)[1].maxValue = 7;
    Array.from(table.columns)[2].maxValue = 8;
    Array.from(table.columns)[3].maxValue = 1;
    Array.from(table.columns)[4].maxValue = 2;

    cy.log(
      Array.from(table.fds[0].rhs)
        .map((col) => col.name)
        .join()
    );
  });

  it("calculates length score correct", () => {
    expect(new FdScore(table, table.fds[0]).testingScore().length).to.equal(
      0.8333333333333333
    );
    expect(new FdScore(table, table.fds[1]).testingScore().length).to.equal(
      0.75
    );
  });

  it("calculates keyValue score correct", () => {
    expect(new FdScore(table, table.fds[0]).testingScore().keyValue).to.equal(
      1
    );
    expect(new FdScore(table, table.fds[1]).testingScore().keyValue).to.equal(
      0.125
    );
  });

  it("calculates position score correct", () => {
    expect(new FdScore(table, table.fds[0]).testingScore().position).to.equal(
      1
    );
    expect(new FdScore(table, table.fds[1]).testingScore().position).to.equal(
      0.6666666666666666
    );
  });

  it("calculates redundance team score correct", () => {
    expect(
      new FdScore(table, table.fds[0]).testingScore().redundanceTeam
    ).to.equal(0.4);
    expect(
      new FdScore(table, table.fds[1]).testingScore().redundanceTeam
    ).to.equal(0);
  });

  it("calculates redundance metanome score correct", () => {
    expect(
      new FdScore(table, table.fds[0]).testingScore().redundanceMetanome
    ).to.equal(1);
    expect(
      new FdScore(table, table.fds[1]).testingScore().redundanceMetanome
    ).to.equal(1);
  });

  it("calculates redundance wei link score correct", () => {
    expect(
      new FdScore(table, table.fds[0]).testingScore().redundanceWeiLink
    ).to.equal(0.8);
    expect(
      new FdScore(table, table.fds[1]).testingScore().redundanceWeiLink
    ).to.equal(0);
  });

  it("calculates similarity score correct", () => {
    expect(new FdScore(table, table.fds[0]).testingScore().similarity).to.equal(
      0.7777777777777777
    );
    expect(new FdScore(table, table.fds[1]).testingScore().similarity).to.equal(
      0.5999999999999999
    );
  });
});
