import Table from './Table';

export function exampleTableSportartVerein(): Table {
  const table: Table = Table.fromColumnNames('Name', 'Sportart', 'Verein');
  table.name = 'Example Table';
  table.addFd(
    table.columns.subsetFromIds(0, 1),
    table.columns.subsetFromIds(2)
  );
  table.addFd(table.columns.subsetFromIds(2), table.columns.subsetFromIds(1));
  table.extendFds();
  return table;
}
export function exampleTable(): Table {
  const table: Table = Table.fromColumnNames(
    'CD_ID',
    'Albumtitel',
    'Interpret',
    'Gründungsjahr',
    'Erscheinungsjahr',
    'Tracknr',
    'Titel'
  );
  table.name = 'Example Table';
  table.addFd(
    table.columns.subsetFromIds(0),
    table.columns.subsetFromIds(1, 2, 3, 4)
  );
  table.addFd(
    table.columns.subsetFromIds(0, 5),
    table.columns.subsetFromIds(1, 2, 3, 4, 6)
  );
  table.addFd(table.columns.subsetFromIds(2), table.columns.subsetFromIds(3));
  table.extendFds();
  return table;
}
