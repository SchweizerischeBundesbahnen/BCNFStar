import Column from './Column';
import ColumnCombination from './ColumnCombination';
import Table from './Table';

describe('ColumnCombination', () => {
  let cc1: ColumnCombination;
  let cc2: ColumnCombination;

  let columnA = new Column('A', 'varchar', 0, new Table());
  let columnB = new Column('B', 'varchar', 1, new Table());
  let columnC = new Column('C', 'varchar', 2, new Table());

  beforeEach(() => {
    cc1 = new ColumnCombination(columnA, columnB);
    cc2 = new ColumnCombination(columnB, columnC);
  });

  it('equals itself', () => {
    expect(cc1.equals(cc1)).toBeTrue();
  });

  it('creates an equal copy', () => {
    let cc1Copy = cc1.copy();
    expect(cc1Copy).not.toBe(cc1);
    expect(cc1Copy.equals(cc1)).toBeTrue;
  });

  it('does not equal another ColumnCombination', () => {
    expect(cc1.equals(cc2)).toBeFalse();
  });

  it('has correct cardinality', () => {
    expect(cc1.cardinality).toEqual(2);
  });

  it('calculates intersect correctly', () => {
    cc1.intersect(cc2);
    let expectedCc = new ColumnCombination(columnB);
    expect(cc1).toEqual(expectedCc);
  });

  it('calculates union correctly', () => {
    cc1.union(cc2);
    let expectedCc = new ColumnCombination(columnA, columnB, columnC);
    expect(cc1).toEqual(expectedCc);
  });

  it('calculates setminus correctly', () => {
    cc1.setMinus(cc2);
    let expectedCc = new ColumnCombination(columnA);
    expect(cc1).toEqual(expectedCc);
  });

  it('checks subset relationship correctly', () => {
    expect(cc1.isSubsetOf(cc2)).toBeFalse();
    expect(cc1.isSubsetOf(cc1.copy())).toBeTrue();
    let ccA = new ColumnCombination(columnA);
    expect(cc1.isSubsetOf(ccA)).toBeFalse();
    expect(ccA.isSubsetOf(cc1)).toBeTrue();
  });

  it('orders columns correctly', () => {
    let priorOrdinalPosition: number;
    cc1.inOrder().forEach((column, index) => {
      if (index != 0) {
        expect(column.ordinalPosition).toBeGreaterThanOrEqual(
          priorOrdinalPosition
        );
      }
      priorOrdinalPosition = column.ordinalPosition;
    });
  });
});
