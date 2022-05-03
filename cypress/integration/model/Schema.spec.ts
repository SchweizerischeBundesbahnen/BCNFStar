import { exampleSchema } from "../../utils/exampleTables";
import Schema from "../../../frontend/src/model/schema/Schema";
import Table from "../../../frontend/src/model/schema/Table";

describe("Schema", () => {
  let schema: Schema;
  let tableA: Table;
  let tableB: Table;
  let tableC: Table;

  beforeEach(() => {
    schema = exampleSchema();
    tableA = [...schema.tables].find((table) => table.name == "TableA")!;
    tableB = [...schema.tables].find((table) => table.name == "TableB")!;
    tableC = [...schema.tables].find((table) => table.name == "TableC")!;
    expect(tableA).to.exist;
  });

  it("calculates fks of a table correctly", () => {
    let fks = schema.fksOf(tableA);
    expect(fks.length).to.equal(1);
    let fk = [...fks][0];
    expect(fk.referencing).to.equal(tableA);
    expect(fk.referenced).to.equal(tableB);
  });

  it("calculates inds of a table correctly", () => {
    let inds = schema.indsOf(tableA);
    expect([...inds.keys()].length).to.equal(1);
    const flatInds = Array.from(inds.values()).flat();
    expect(flatInds.length).to.equal(1);
    let ind = flatInds[0];
    expect(ind.referencing).to.equal(tableA);
    expect(ind.referenced).to.equal(tableC);
  });

  it("fds of joined table contain fds of parent tables", () => {
    let relationship = schema
      .fksOf(tableA)
      .find((rel) => rel.referenced == tableB)!;
    let joinedTable = schema.join(relationship);
    for (let table of [tableA, tableB]) {
      table.fds.forEach((requiredFd) => {
        let requiredLhs = requiredFd.lhs;
        let requiredRhs = requiredFd.rhs;
        expect(
          joinedTable.fds.find(
            (fd) => requiredLhs.equals(fd.lhs) && requiredRhs.isSubsetOf(fd.rhs)
          )
        ).to.exist;
      });
    }
  });
});
