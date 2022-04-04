import ITable from "../../server/definitions/ITable";
import Relationship from "../../frontend/src/model/schema/Relationship";
import Schema from "../../frontend/src/model/schema/Schema";
import Table from "../../frontend/src/model/schema/Table";

export const exampleITable: Array<ITable> = [
  {
    name: "Example Table",
    attribute: [
      { dataType: "int", name: "CD_ID" },
      { dataType: "varchar", name: "Albumtitel" },
      { dataType: "varchar", name: "Interpret" },
      { dataType: "int", name: "Gründungsjahr" },
      { dataType: "int", name: "Erscheinungsjahr" },
      { dataType: "int", name: "Tracknr" },
      { dataType: "int", name: "Titel" },
    ],
  },
];

export function exampleTableSportartVerein(): Table {
  const table: Table = Table.fromColumnNames("Name", "Sportart", "Verein");
  table.name = "Example Table";
  table.addFd(
    table.columns.columnsFromNames("Name", "Sportart"),
    table.columns.columnsFromNames("Verein")
  );
  table.addFd(
    table.columns.columnsFromNames("Verein"),
    table.columns.columnsFromNames("Sportart")
  );
  return table;
}

export function exampleTable(): Table {
  const table = Table.fromITable(exampleITable[0]);

  let otherSourceTable = Table.fromColumnNames("Interpret", "Gründungsjahr");
  table.columns
    .setMinus(table.columns.columnsFromNames("Gründungsjahr"))
    .union(otherSourceTable.columns.columnsFromNames("Gründungsjahr"));
  table.sourceTables.add(otherSourceTable);
  let relationship = new Relationship();
  relationship.add(
    table.columns.columnFromName("Interpret")!,
    otherSourceTable.columns.columnFromName("Interpret")!
  );
  table.relationships.add(relationship);

  table.addFd(
    table.columns.columnsFromNames("CD_ID", "Tracknr"),
    table.columns.columnsFromNames(
      "Albumtitel",
      "Interpret",
      "Gründungsjahr",
      "Erscheinungsjahr",
      "Titel"
    )
  );
  table.addFd(
    table.columns.columnsFromNames("CD_ID"),
    table.columns.columnsFromNames(
      "Albumtitel",
      "Interpret",
      "Gründungsjahr",
      "Erscheinungsjahr"
    )
  );
  table.addFd(
    table.columns.columnsFromNames("Interpret"),
    table.columns.columnsFromNames("Gründungsjahr")
  );
  return table;
}
export function exampleSchema(): Schema {
  let schema = new Schema();

  let tableA = Table.fromColumnNames("A1", "A2", "A3");
  let tableB = Table.fromColumnNames("B1", "B2", "B3");
  let tableC = Table.fromColumnNames("C1", "C2", "C3");
  tableA.pk = tableB.columns.columnsFromNames("A1");
  tableB.pk = tableB.columns.columnsFromNames("B1");
  tableC.pk = tableB.columns.columnsFromNames("C1");
  tableA.name = "TableA";
  tableB.name = "TableB";
  tableC.name = "TableC";
  tableA.addFd(
    tableA.columns.columnsFromNames("A1"),
    tableA.columns.columnsFromNames("A2", "A3")
  );
  tableB.addFd(
    tableB.columns.columnsFromNames("B1"),
    tableA.columns.columnsFromNames("B2", "B3")
  );
  tableC.addFd(
    tableC.columns.columnsFromNames("C1"),
    tableA.columns.columnsFromNames("C2", "C3")
  );
  tableA.addFd(
    tableA.columns.columnsFromNames("A2"),
    tableA.columns.columnsFromNames("A3")
  );

  schema.add(tableA, tableB, tableC);

  let relAB = new Relationship();
  relAB.add(
    tableA.columns.columnFromName("A2")!,
    tableB.columns.columnFromName("B1")!
  );
  let relBC = new Relationship();
  relBC.add(
    tableB.columns.columnFromName("B2")!,
    tableC.columns.columnFromName("C1")!
  );
  let relAC = new Relationship();
  relAC.add(
    tableA.columns.columnFromName("A3")!,
    tableC.columns.columnFromName("C1")!
  );
  schema.addFkRelationship(relAB);
  schema.addFkRelationship(relBC);
  schema.addIndRelationship(relAC);

  return schema;
}
