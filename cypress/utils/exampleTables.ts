import ITable from "../../server/definitions/ITable";
import Relationship from "../../frontend/src/model/schema/Relationship";
import Schema from "../../frontend/src/model/schema/Schema";
import Table from "../../frontend/src/model/schema/Table";
import FunctionalDependency from "../../frontend/src/model/schema/FunctionalDependency";
import SourceRelationship from "../../frontend/src/model/schema/SourceRelationship";
import SourceFunctionalDependency from "../../frontend/src/model/schema/SourceFunctionalDependency";
import Column from "../../frontend/src/model/schema/Column";
import ColumnCombination from "../../frontend/src/model/schema/ColumnCombination";

export function sportartVereinTable(): Table {
  const table = Table.fromColumnNames(
    ["Name", "Sportart", "Verein"],
    "Sportart_Verein"
  );
  table.addFd(
    new FunctionalDependency(
      new ColumnCombination(table.columns.columnsFromNames("Name", "Sportart")),
      new ColumnCombination(table.columns.columnsFromNames("Verein"))
    )
  );
  table.addFd(
    new FunctionalDependency(
      new ColumnCombination(table.columns.columnsFromNames("Verein")),
      new ColumnCombination(table.columns.columnsFromNames("Sportart"))
    )
  );
  return table;
}

export function CDSchema(): Schema {
  const schema = new Schema();
  const cdTracksTable = Table.fromColumnNames(
    [
      "CD_ID",
      "Tracknr",
      "Albumtitel",
      "Interpret",
      "Erscheinungsjahr",
      "Titel",
    ],
    "CD_Tracks"
  );
  const interpretTable = Table.fromColumnNames(
    ["Interpret", "Gründungsjahr"],
    "Interpret"
  );

  schema.addTables(cdTracksTable, interpretTable);
  const fk = new SourceRelationship();
  fk.referencing.push(
    cdTracksTable.columns.columnFromName("Interpret").sourceColumn
  );
  fk.referenced.push(
    interpretTable.columns.columnFromName("Interpret").sourceColumn
  );
  schema.addFk(fk);

  schema.addFd(
    new SourceFunctionalDependency(
      cdTracksTable.columns
        .columnsFromNames("CD_ID", "Tracknr")
        .map((col) => col.sourceColumn),
      cdTracksTable.columns
        .columnsFromNames(
          "Albumtitel",
          "Interpret",
          "Erscheinungsjahr",
          "Titel"
        )
        .map((col) => col.sourceColumn)
    )
  );

  schema.addFd(
    new SourceFunctionalDependency(
      cdTracksTable.columns
        .columnsFromNames("CD_ID")
        .map((col) => col.sourceColumn),
      cdTracksTable.columns
        .columnsFromNames("Albumtitel", "Interpret", "Erscheinungsjahr")
        .map((col) => col.sourceColumn)
    )
  );

  schema.addFd(
    new SourceFunctionalDependency(
      interpretTable.columns
        .columnsFromNames("Interpret")
        .map((col) => col.sourceColumn),
      cdTracksTable.columns
        .columnsFromNames("Gründungsjahr")
        .map((col) => col.sourceColumn)
    )
  );

  return schema;
}

export function exampleSchema(): Schema {
  let schema = new Schema();

  let tableA = Table.fromColumnNames(
    ["A1", "A2", "A3", "A4", "A5", "A6"],
    "TableA"
  );
  let tableB = Table.fromColumnNames(["B1", "B2", "B3"], "TableB");
  let tableC = Table.fromColumnNames(["C1", "C2"], "TableC");

  schema.addTables(tableA, tableB, tableC);

  let [a1, a2, a3, a4, a5, a6] = tableA.columns.columnsFromNames(
    "A1",
    "A2",
    "A3",
    "A4",
    "A5",
    "A6"
  );
  let [b1, b2, b3] = tableB.columns.columnsFromNames("B1", "B2", "B3");
  let [c1, c2] = tableC.columns.columnsFromNames("C1", "C2");

  tableA.pk = new ColumnCombination([a1]);
  tableB.pk = new ColumnCombination([b1, b2]);
  tableC.pk = new ColumnCombination([c1]);

  schema.addFd(
    new SourceFunctionalDependency(
      [a1.sourceColumn],
      [
        a2.sourceColumn,
        a3.sourceColumn,
        a4.sourceColumn,
        a5.sourceColumn,
        a6.sourceColumn,
      ]
    )
  );
  schema.addFd(
    new SourceFunctionalDependency([a3.sourceColumn], [a4.sourceColumn])
  );
  schema.addFd(
    new SourceFunctionalDependency([a5.sourceColumn], [a6.sourceColumn])
  );

  schema.addFd(
    new SourceFunctionalDependency(
      [b1.sourceColumn, b2.sourceColumn],
      [b3.sourceColumn]
    )
  );
  schema.addFd(
    new SourceFunctionalDependency([b3.sourceColumn], [b2.sourceColumn])
  );

  schema.addFd(
    new SourceFunctionalDependency([c1.sourceColumn], [c2.sourceColumn])
  );

  schema.calculateFdsOf(tableA);
  schema.calculateFdsOf(tableB);
  schema.calculateFdsOf(tableC);

  schema.addFk(
    new SourceRelationship(
      [a2.sourceColumn, a3.sourceColumn],
      [b1.sourceColumn, b2.sourceColumn]
    )
  );
  schema.addFk(new SourceRelationship([b2.sourceColumn], [c1.sourceColumn]));
  schema.addFk(new SourceRelationship([a5.sourceColumn], [c1.sourceColumn]));
  schema.addInd(new SourceRelationship([a4.sourceColumn], [c1.sourceColumn]));

  return schema;
}

export function multiFkSchema(): Schema {
  const schema = new Schema();
  const tableC = Table.fromColumnNames(["c_a1", "c_a2"], "TableC");
  const tableA = Table.fromColumnNames(
    ["a_a1", "a_a2", "a_b1", "a_b2", "a_a3"],
    "TableA"
  );
  const tableB = Table.fromColumnNames(["b_b1", "b_b2", "b_b3"], "TableB");
  tableB.addFd(
    new FunctionalDependency(
      new ColumnCombination(tableB.columns.columnsFromNames("b_b1", "b_b2")),
      tableB.columns.copy()
    )
  );
  tableA.addFd(
    new FunctionalDependency(
      new ColumnCombination(tableA.columns.columnsFromNames("a_a1", "a_a2")),
      tableA.columns.copy()
    )
  );
  tableA.addFd(
    new FunctionalDependency(
      new ColumnCombination(tableA.columns.columnsFromNames("a_a3")),
      new ColumnCombination(
        tableA.columns.columnsFromNames("a_a2", "a_b1", "a_b2", "a_a3")
      )
    )
  );
  schema.addTables(tableC, tableA, tableB);
  schema.addFk(
    new SourceRelationship(
      tableC.columns
        .columnsFromNames("c_a1", "c_a2")
        .map((col) => col.sourceColumn),
      tableA.columns
        .columnsFromNames("a_a1", "a_a2")
        .map((col) => col.sourceColumn)
    )
  );
  schema.addFk(
    new SourceRelationship(
      tableA.columns
        .columnsFromNames("a_b1", "a_b2")
        .map((col) => col.sourceColumn),
      tableB.columns
        .columnsFromNames("b_b1", "b_b2")
        .map((col) => col.sourceColumn)
    )
  );
  return schema;
}
