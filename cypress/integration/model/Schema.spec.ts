import { exampleSchema, multiFkSchema } from "../../utils/exampleTables";
import Schema from "../../../frontend/src/model/schema/Schema";
import Table from "../../../frontend/src/model/schema/Table";
import Column from "../../../frontend/src/model/schema/Column";
import JoinCommand from "../../../frontend/src/model/commands/JoinCommand";
import SourceTableInstance from "../../../frontend/src/model/schema/SourceTableInstance";
import FunctionalDependency from "../../../frontend/src/model/schema/FunctionalDependency";
import ColumnCombination from "../../../frontend/src/model/schema/ColumnCombination";
import DismissFkCommand from "../../../frontend/src/model/commands/DismissFkCommand";
import ShowFkCommand from "../../../frontend/src/model/commands/ShowFkCommand";

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

  it("fds of joined tables contain right fds", () => {
    let join = new JoinCommand(
      schema,
      schema.fksOf(tableA, true).find((rel) => rel.referenced == tableB)!,
      false
    );
    join.do();
    let table = join.newTable!;

    join = new JoinCommand(
      schema,
      schema
        .fksOf(table, true)
        .find((rel) => rel.relationship.referencing[0].name != "A5")!,
      true
    );
    join.do();
    table = join.newTable!;

    join = new JoinCommand(schema, schema.fksOf(table, true)[0], false);
    join.do();
    table = join.newTable!;

    const colsBySource = table.columnsBySource();

    const a = table.sources[0];
    const b = table.sources[1];
    const c1 = table.sources[2];
    const c2 = table.sources[3];

    const cols = new Map<SourceTableInstance, Map<string, Column>>();
    table.sources.forEach((source) => cols.set(source, new Map()));
    table.columns
      .asArray()
      .forEach((column) =>
        cols
          .get(column.sourceTableInstance)!
          .set(column.sourceColumn.name, column)
      );

    const aCols = cols.get(a)!;
    const bCols = cols.get(b)!;
    const c1Cols = cols.get(c1)!;
    const c2Cols = cols.get(c2)!;

    const fds = [
      {
        lhs: [[a, ["A1"]]],
        rhs: [
          [a, ["A2", "A3", "A4", "A5", "A6"]],
          [b, ["B3"]],
          [c1, ["C2"]],
          [c2, ["C2"]],
        ],
      },
      {
        lhs: [[a, ["A3"]]],
        rhs: [
          [a, ["A4"]],
          [c1, ["C2"]],
        ],
      },
      {
        lhs: [[a, ["A2", "A3"]]],
        rhs: [
          [a, ["A4"]],
          [b, ["B3"]],
          [c1, ["C2"]],
        ],
      },
      {
        lhs: [[b, ["B3"]]],
        rhs: [
          [a, ["A3", "A4"]],
          [c1, ["C2"]],
        ],
      },
      {
        lhs: [[a, ["A5"]]],
        rhs: [
          [a, ["A6"]],
          [c2, ["C2"]],
        ],
      },
    ];

    for (const Ifd of fds) {
      const Ilhs = Ifd.lhs;
      const Irhs = Ifd.rhs;
      const lhs = new ColumnCombination();
      for (const ISourceCols of Ilhs) {
        const source = ISourceCols[0] as SourceTableInstance;
        const Icols = ISourceCols[1] as Array<string>;
        lhs.add(...Icols.map((name) => cols.get(source)!.get(name)!));
      }
      const rhs = new ColumnCombination();
      for (const ISourceCols of Irhs) {
        const source = ISourceCols[0] as SourceTableInstance;
        const Icols = ISourceCols[1] as Array<string>;
        rhs.add(...Icols.map((name) => cols.get(source)!.get(name)!));
      }
      const fd = new FunctionalDependency(lhs, rhs);

      expect(
        table.fds.some(
          (other) => other.lhs.equals(fd.lhs) && other.rhs.equals(fd.rhs)
        )
      ).to.be.true;
    }
    expect(table.fds.length).to.equal(fds.length);

    expect(
      table.fds.every((fd) =>
        fd.lhs.asArray().every((col) => table.columns.asArray().includes(col))
      )
    ).to.be.true;
    expect(
      table.fds.every((fd) =>
        fd.rhs.asArray().every((col) => table.columns.asArray().includes(col))
      )
    ).to.be.true;
  });

  it("calculates fks of a table correctly", () => {
    let fks = schema.fksOf(tableA, true);
    expect(fks.length).to.equal(2);
    let fk = fks[0];
    expect(fk.referencing).to.equal(tableA);
    expect(fk.referenced).to.equal(tableB);
  });

  it("dismisses fks correctly", () => {
    const fk = schema.fksOf(tableA, true)[0];
    const dismissCommand = new DismissFkCommand(schema, fk);
    dismissCommand.do();
    expect(schema.fksOf(tableA, true)).to.not.include(fk);
    dismissCommand.undo();
    expect(schema.fksOf(tableA, true)).to.include(fk);
  });

  it("readds fks correctly", () => {
    const fk = schema.hiddenFksOf(tableA)[0];
    expect(schema.fksOf(tableA, true)).to.not.include(fk);
    const showCommand = new ShowFkCommand(schema, fk);
    showCommand.do();
    expect(schema.fksOf(tableA, true)).to.include(fk);
    showCommand.undo();
    expect(schema.fksOf(tableA, true)).to.not.include(fk);
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

  it("checks splittability of fds correctly", () => {
    schema = multiFkSchema();
    tableA = [...schema.tables].find((table) => table.name == "TableA")!;
    tableB = [...schema.tables].find((table) => table.name == "TableB")!;
    tableC = [...schema.tables].find((table) => table.name == "TableC")!;
    expect(tableA.violatingFds().length).to.equal(1);
    const fd = tableA.violatingFds()[0];
    expect(schema.splittableFdsOf(tableA).length).to.equal(0);

    expect(schema.fdSplitReferenceViolationsOf(fd, tableA).length).to.equal(1);
    expect(
      schema.fdSplitReferenceViolationsOf(fd, tableA)[0].referencing
    ).to.equal(tableC);

    expect(schema.fdSplitFKViolationsOf(fd, tableA).length).to.equal(0);

    fd.rhs.delete(...tableA.columns.columnsFromNames("a_a2", "a_b1"));

    expect(schema.fdSplitReferenceViolationsOf(fd, tableA).length).to.equal(0);

    expect(schema.fdSplitFKViolationsOf(fd, tableA).length).to.equal(1);
    expect(schema.fdSplitFKViolationsOf(fd, tableA)[0].referenced).to.equal(
      tableB
    );
  });
});
