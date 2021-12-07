import { exampleTable } from './exampleTables';
import Table from './Table';

describe('FunctionalDependency', () => {
  let table: Table;

  beforeEach(() => {
    table = exampleTable();
  });

  it('should extend correctly', () => {
    table.addFd(
      table.columns.subsetFromIds(2),
      table.columns.subsetFromIds(3, 4)
    );
    table.extendFds();
    expect(table.fds[3].lhs).toEqual(table.columns.subsetFromIds(2));
    expect(table.fds[3].rhs).toEqual(table.columns.subsetFromIds(2, 3, 4));
  });

  it('should check for key correctly', () => {
    expect(table.fds[0].isKey()).toBeTrue();
    expect(table.fds[1].isKey()).toBeFalse();
    expect(table.fds[2].isKey()).toBeFalse();
  });

  it('should check for bcnf violation correctly', () => {
    expect(table.fds[0].violatesBCNF()).toBeFalse();
    expect(table.fds[1].violatesBCNF()).toBeTrue();
    expect(table.fds[2].violatesBCNF()).toBeTrue();
  });

  it('should check for full triviality correctly', () => {
    expect(table.fds[0].isFullyTrivial()).toBeFalse();
    expect(table.fds[1].isFullyTrivial()).toBeFalse();
    expect(table.fds[2].isFullyTrivial()).toBeFalse();

    table.addFd(table.columns.subsetFromIds(0), table.columns.subsetFromIds(0));
    expect(table.fds[3].isFullyTrivial()).toBeTrue();
  });
});
