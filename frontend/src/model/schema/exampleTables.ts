import ITable from '@server/definitions/ITable';
import Relationship from './Relationship';
import Schema from './Schema';
import Table from './Table';

export const exampleITable: Array<ITable> = [
  {
    name: 'Example Table',
    schemaName: 'public',
    attributes: [
      { dataType: 'int', name: 'CD_ID' },
      { dataType: 'varchar', name: 'Albumtitel' },
      { dataType: 'varchar', name: 'Interpret' },
      { dataType: 'int', name: 'Gründungsjahr' },
      { dataType: 'int', name: 'Erscheinungsjahr' },
      { dataType: 'int', name: 'Tracknr' },
      { dataType: 'int', name: 'Titel' },
    ],
  },
];

export function exampleTableSportartVerein(): Table {
  const table: Table = Table.fromColumnNames(
    ['Name', 'Sportart', 'Verein'],
    'Example Table'
  );
  table.addFd(
    table.columns.columnsFromIds(0, 1),
    table.columns.columnsFromIds(2)
  );
  table.addFd(table.columns.columnsFromIds(2), table.columns.columnsFromIds(1));
  return table;
}
export function exampleTable(): Table {
  const table = Table.fromITable(exampleITable[0]);

  table.addFd(
    table.columns.columnsFromIds(0, 5),
    table.columns.columnsFromIds(1, 2, 3, 4, 6)
  );
  table.addFd(
    table.columns.columnsFromIds(0),
    table.columns.columnsFromIds(1, 2, 3, 4)
  );
  table.addFd(table.columns.columnsFromIds(2), table.columns.columnsFromIds(3));
  return table;
}
export function exampleSchema(): Schema {
  let schema = new Schema();

  let tableA = Table.fromColumnNames(['A1', 'A2', 'A3', 'A4'], 'TableA');
  tableA.addFd(
    tableA.columns.columnsFromNames('A2'),
    tableA.columns.columnsFromNames('A3', 'A4')
  );
  tableA.addFd(
    tableA.columns.columnsFromNames('A1'),
    tableA.columns.columnsFromNames('A3')
  );
  let tableB = Table.fromColumnNames(['B1', 'B2', 'B3', 'B4'], 'TableB');
  tableB.pk = tableB.columns.columnsFromNames('B1', 'B2');
  tableB.addFd(
    tableB.columns.columnsFromNames('B1', 'B2'),
    tableB.columns.columnsFromNames('B1', 'B2', 'B3', 'B4')
  );
  tableB.addFd(
    tableB.columns.columnsFromNames('B1'),
    tableB.columns.columnsFromNames('B4')
  );
  schema.add(tableA, tableB);

  let relAB = new Relationship();
  relAB.add(
    tableA.columns.columnFromName('A3')!,
    tableB.columns.columnFromName('B1')!
  );
  relAB.add(
    tableA.columns.columnFromName('A4')!,
    tableB.columns.columnFromName('B2')!
  );
  schema.addFk(relAB);

  schema.join(tableA, tableB, relAB);

  return schema;
}
