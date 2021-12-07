import { exampleTable } from './exampleTables';
import FunctionalDependency from './FunctionalDependency';
import Table from './Table';

describe('Table', () => {
  let table: Table;

  beforeEach(() => {
    table = exampleTable();
  });

  it('should initially have no children', () => {
    expect(table.hasChildren).toBeFalse();
  });

  it('should split columns correctly', () => {
    let children = table.split(table.fds[1]);

    expect(children[0].columns).toEqual(table.columns.subsetFromIds(0, 5, 6));
    expect(children[1].columns).toEqual(
      table.columns.subsetFromIds(0, 1, 2, 3, 4)
    );
  });

  it('should split references correctly', () => {
    let children = table.split(table.fds[1]);

    expect(children[0].referencedTables).toEqual([children[1]]);
    expect(children[0].referencingTables.length).toEqual(0);

    expect(children[1].referencingTables).toEqual([children[0]]);
    expect(children[1].referencedTables.length).toEqual(0);
  });

  it('should split fds correctly', () => {
    let children = table.split(table.fds[1]);

    let fd1 = new FunctionalDependency(
      children[0],
      children[0].columns.subsetFromIds(0, 1),
      children[0].columns.subsetFromIds(0, 1, 2)
    );
    expect(children[0].fds).toEqual([fd1]);

    let fd2 = new FunctionalDependency(
      children[1],
      children[1].columns.subsetFromIds(0),
      children[1].columns.subsetFromIds(0, 1, 2, 3, 4, 5)
    );
    let fd3 = new FunctionalDependency(
      children[1],
      children[1].columns.subsetFromIds(2),
      children[1].columns.subsetFromIds(2, 3)
    );
    expect(children[1].fds).toEqual([fd2, fd3]);
  });
});
