import { exampleSchema } from './exampleTables';
import Schema from './Schema';
import Table from './Table';

describe('Schema', () => {
  let schema: Schema;
  let tableA: Table;
  let tableB: Table;
  let tableC: Table;

  beforeEach(() => {
    schema = exampleSchema();
    tableA = [...schema.tables].find((table) => table.name == 'TableA')!;
    tableB = [...schema.tables].find((table) => table.name == 'TableB')!;
    tableC = [...schema.tables].find((table) => table.name == 'TableC')!;
  });

  it('calculates fks of a table correctly', () => {
    let fks = schema.fksOf(tableA);
    expect(fks.size).toEqual(1);
    let fk = [...fks][0];
    expect(fk.table).toEqual(tableB);
  });

  it('calculates inds of a table correctly', () => {
    let inds = schema.indsOf(tableA);
    expect(inds.length).toEqual(1);
    let ind = inds[0];
    expect(ind.table).toEqual(tableC);
  });

  it('fds of joined table contain fds of parent tables', () => {
    let relationship = [...schema.fkRelationships].find(
      (rel) => rel.appliesTo(tableA, tableB) || rel.appliesTo(tableB, tableA)
    )!;
    let joinedTable = schema.join(tableA, tableB, relationship);
    for (let table of [tableA, tableB]) {
      table.fds.forEach((requiredFd) => {
        let requiredLhs = relationship.referencingToReferencedColumnsIn(
          requiredFd.lhs
        );
        let requiredRhs = relationship.referencingToReferencedColumnsIn(
          requiredFd.rhs
        );
        expect(
          joinedTable.fds.find(
            (fd) => requiredLhs.equals(fd.lhs) && requiredRhs.isSubsetOf(fd.rhs)
          )
        ).toBeDefined();
      });
    }
  });
});
