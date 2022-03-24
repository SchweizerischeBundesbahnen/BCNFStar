import { exampleTable } from './exampleTables';
import FunctionalDependency from './FunctionalDependency';
import Relationship from './Relationship';
import Table from './Table';

describe('Table', () => {
  let table: Table;

  beforeEach(() => {
    table = exampleTable();
  });

  it('splits columns correcty', () => {
    let splitTables = table.split(table.fds[1]);
    let expectedSplitTables = expectedSplitTablesFd1(table);
    expect(splitTables[0].columns).toEqual(expectedSplitTables[0].columns);
    expect(splitTables[1].columns).toEqual(expectedSplitTables[1].columns);
  });

  it('splits fds correcty', () => {
    let splitTables = table.split(table.fds[1]);
    let expectedSplitTables = expectedSplitTablesFd1(table);
    expect(splitTables[0].fds).toEqual(expectedSplitTables[0].fds);
    expect(splitTables[1].fds).toEqual(expectedSplitTables[1].fds);
  });

  it('splits sourceTables and relationships correcty', () => {
    let splitTables = table.split(table.fds[1]);
    let expectedSplitTables = expectedSplitTablesFd1(table);
    expect(splitTables[0].sourceTables).toEqual(
      expectedSplitTables[0].sourceTables
    );
    expect(splitTables[1].sourceTables).toEqual(
      expectedSplitTables[1].sourceTables
    );
    expect(splitTables[0].relationships).toEqual(
      expectedSplitTables[0].relationships
    );
    expect(splitTables[1].relationships).toEqual(
      expectedSplitTables[1].relationships
    );
  });

  it('joins columns correcty', () => {
    let splitTables = expectedSplitTablesFd1(table);
    let joinedTable = splitTables[0].join(
      splitTables[1],
      Relationship.fromTables(splitTables[0], splitTables[1])
    );
    expect(joinedTable.columns).toEqual(table.columns);
  });

  it('joins sourceTables and relationships correcty', () => {
    let splitTables = expectedSplitTablesFd1(table);
    let joinedTable = splitTables[0].join(
      splitTables[1],
      Relationship.fromTables(splitTables[0], splitTables[1])
    );
    expect(joinedTable.sourceTables).toEqual(table.sourceTables);
    expect(joinedTable.relationships).toEqual(table.relationships);
  });
});

function expectedSplitTablesFd1(table: Table): Array<Table> {
  //columns
  let remaining = new Table(
    table.columns.columnsFromNames('CD_ID', 'Tracknr', 'Titel')
  );
  let generating = new Table(
    table.columns.columnsFromNames(
      'CD_ID',
      'Albumtitel',
      'Interpret',
      'Gründungsjahr',
      'Erscheinungsjahr'
    )
  );
  //fds
  remaining.fds = [
    new FunctionalDependency(
      table.fds[0].lhs.copy(),
      table.columns.columnsFromNames('Titel')
    ),
  ];
  generating.fds = [table.fds[1], table.fds[2]];
  //sourceTables
  remaining.sourceTables = new Set([table]);
  generating.sourceTables = new Set(Array.from(table.sourceTables));
  //relationships
  remaining.relationships = new Set();
  generating.relationships = new Set([...table.relationships]);
  return [remaining, generating];
}
