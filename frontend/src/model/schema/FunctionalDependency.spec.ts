import Table from './Table';

describe('FunctionalDependency', () => {
  let table: Table;

  beforeEach(() => {
    table = Table.fromColumnNames('A', 'B', 'C', 'D');
    table.addFd(
      table.columns.columnsFromNames('A'),
      table.columns.columnsFromNames('B', 'C')
    );
    table.addFd(
      table.columns.columnsFromNames('A'),
      table.columns.columnsFromNames('A')
    );
  });

  it('extends correctly', () => {
    table.addFd(
      table.columns.columnsFromNames('A'),
      table.columns.columnsFromNames('B', 'C')
    );
    expect(table.fds[0].lhs).toEqual(table.columns.columnsFromNames('A'));
    expect(table.fds[0].rhs).toEqual(
      table.columns.columnsFromNames('A', 'B', 'C')
    );
  });

  it('checks full triviality correctly', () => {
    expect(table.fds[0].isFullyTrivial()).toBeFalse();
    expect(table.fds[1].isFullyTrivial()).toBeTrue();
  });
});
