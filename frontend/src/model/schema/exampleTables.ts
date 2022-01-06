import ITable from '@server/definitions/ITable';
import Table from './Table';

export const exampleITable: Array<ITable> = [
  {
    name: 'Example Table',
    attribute: [
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
  const table: Table = Table.fromColumnNames('Name', 'Sportart', 'Verein');
  table.name = 'Example Table';
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
