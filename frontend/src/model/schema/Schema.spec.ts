import { exampleSchema, exampleTable } from './exampleTables';
import Schema from './Schema';

describe('Schema', () => {
  let schema: Schema;

  beforeEach(() => {
    schema = new Schema(exampleTable());
  });

  it('should have table which it is constructed with', () => {
    expect(schema.tables).toEqual(new Set([exampleTable()]));
  });

  it('should not contain a table after splitting it', () => {
    let table = [...schema.tables][0];
    schema.split(table, table.violatingFds()[0]);
    expect(schema.tables).not.toContain(table);
  });

  it('should auto-normalize correctly', () => {
    let table = [...schema.tables][0];
    schema.autoNormalize(table);
    let schema2 = new Schema(table);
    let children = schema2.split(table, table.violatingFds()[0]);
    schema2.split(children[1], children[1].violatingFds()[0]);
    expect([...schema.tables].map((table) => table.toTestString())).toEqual(
      [...schema2.tables].map((table) => table.toTestString())
    );
  });

  it('should join columns correctly', () => {
    let schema = exampleSchema();
    let tableA = [...schema.tables].filter(
      (table) => table.name == 'TableA'
    )[0];
    let tableB = [...schema.tables].filter(
      (table) => table.name == 'TableB'
    )[0];
    schema.join(tableA, tableB, schema.fks[0]);
    let expectedColumns = tableA.columns.columnsFromNames('A1', 'A2');
    expectedColumns.union(tableB.columns.copy());
    expect([...schema.tables][0].columns).toEqual(expectedColumns);
  });
});
