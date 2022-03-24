import Column from './Column';
import Table from './Table';

describe('Column', () => {
  let columnA: Column;

  beforeEach(() => {
    columnA = new Column('A', 'int', 1, new Table());
  });

  it('equals itself', () => {
    expect(columnA.equals(columnA)).toBeTrue();
  });

  it('creates an equal copy', () => {
    let columnACopy = columnA.copy();
    expect(columnACopy.equals(columnA)).toBeTrue();
  });
});
