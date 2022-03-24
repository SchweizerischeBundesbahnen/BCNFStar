import ITable from '@server/definitions/ITable';
import Relationship from './Relationship';
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
    table.columns.columnsFromNames('Name', 'Sportart'),
    table.columns.columnsFromNames('Verein')
  );
  table.addFd(
    table.columns.columnsFromNames('Verein'),
    table.columns.columnsFromNames('Sportart')
  );
  return table;
}

export function exampleTable(): Table {
  const table = Table.fromITable(exampleITable[0]);

  let otherSourceTable = Table.fromColumnNames('Interpret', 'Gründungsjahr');
  table.columns
    .setMinus(table.columns.columnsFromNames('Gründungsjahr'))
    .union(otherSourceTable.columns.columnsFromNames('Gründungsjahr'));
  table.sourceTables.add(otherSourceTable);
  let relationship = new Relationship();
  relationship.add(
    table.columns.columnFromName('Interpret')!,
    otherSourceTable.columns.columnFromName('Interpret')!
  );
  table.relationships.add(relationship);

  table.addFd(
    table.columns.columnsFromNames('CD_ID', 'Tracknr'),
    table.columns.columnsFromNames(
      'Albumtitel',
      'Interpret',
      'Gründungsjahr',
      'Erscheinungsjahr',
      'Titel'
    )
  );
  table.addFd(
    table.columns.columnsFromNames('CD_ID'),
    table.columns.columnsFromNames(
      'Albumtitel',
      'Interpret',
      'Gründungsjahr',
      'Erscheinungsjahr'
    )
  );
  table.addFd(
    table.columns.columnsFromNames('Interpret'),
    table.columns.columnsFromNames('Gründungsjahr')
  );
  return table;
}
/*export function exampleSchema(): Schema {
  let schema = new Schema();

  let tableA = Table.fromColumnNames('A1', 'A2', 'A3', 'A4');
  tableA.name = 'TableA';
  tableA.addFd(
    tableA.columns.columnsFromNames('A2'),
    tableA.columns.columnsFromNames('A3', 'A4')
  );
  tableA.addFd(
    tableA.columns.columnsFromNames('A1'),
    tableA.columns.columnsFromNames('A3')
  );
  let tableB = Table.fromColumnNames('B1', 'B2', 'B3', 'B4');
  tableB.name = 'TableB';
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
}*/
