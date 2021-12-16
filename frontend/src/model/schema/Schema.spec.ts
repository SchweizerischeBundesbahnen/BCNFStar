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
});
