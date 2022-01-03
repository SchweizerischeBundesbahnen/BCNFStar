import { exampleTable } from './exampleTables';
import FunctionalDependency from './FunctionalDependency';
import Table from './Table';

describe('Table', () => {
  let table: Table;

  beforeEach(() => {
    table = exampleTable();
  });

  it('should initially be its own origin', () => {
    expect(table.origin).toBe(table);
  });

  it('should split columns correctly', () => {
    let children = table.split(table.fds[1]);

    expect(children[0].columns).toEqual(table.columns.columnsFromIds(0, 5, 6));
    expect(children[1].columns).toEqual(
      table.columns.columnsFromIds(0, 1, 2, 3, 4)
    );
  });

  it('should split references correctly', () => {
    let children = table.split(table.fds[1]);

    expect(children[0].referencedTables).toEqual(new Set([children[1]]));
    expect(children[0].referencingTables.size).toEqual(0);

    expect(children[1].referencingTables).toEqual(new Set([children[0]]));
    expect(children[1].referencedTables.size).toEqual(0);
  });

  it('should pass the origin reference when splitting', () => {
    let children = table.split(table.fds[1]);

    expect(children[0].origin).toBe(table.origin);
    expect(children[1].origin).toBe(table.origin);
  });

  it('should split fds correctly', () => {
    let children = table.split(table.fds[1]);

    let fd1 = new FunctionalDependency(
      children[0],
      children[0].columns.columnsFromIds(0, 1),
      children[0].columns.columnsFromIds(0, 1, 2)
    );
    expect(children[0].fds).toEqual([fd1]);

    let fd2 = new FunctionalDependency(
      children[1],
      children[1].columns.columnsFromIds(0),
      children[1].columns.columnsFromIds(0, 1, 2, 3, 4, 5)
    );
    let fd3 = new FunctionalDependency(
      children[1],
      children[1].columns.columnsFromIds(2),
      children[1].columns.columnsFromIds(2, 3)
    );
    expect(children[1].fds).toEqual([fd2, fd3]);
  });
});
