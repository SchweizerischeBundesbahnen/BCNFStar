import { exampleTable } from './exampleTables';
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
    schema.autoNormalize(...schema.tables);
    let schema2 = new Schema(table);
    let children = schema2.split(table, table.violatingFds()[0]);
    schema2.split(children[1], children[1].violatingFds()[0]);
    expect([...schema.tables].map((table) => table.toString())).toEqual(
      [...schema2.tables].map((table) => table.toString())
    );
  });
});
