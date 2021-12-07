import Column from './Column';

import ColumnCombination from './ColumnCombination';

describe('ColumnCombination', () => {
  let cc1: ColumnCombination;
  let cc2: ColumnCombination;

  let columnA = new Column('A', '', 0);
  let columnB = new Column('B', '', 1);
  let columnC = new Column('C', '', 2);

  beforeEach(() => {
    cc1 = new ColumnCombination(columnA, columnB);
    cc2 = new ColumnCombination(columnB, columnC);
  });

  it('should copy correctly', () => {
    let cc1Copy = cc1.copy();
    expect(cc1Copy).not.toBe(cc1);
    expect(cc1Copy).toEqual(cc1);
  });

  it('should have correct cardinality', () => {
    expect(cc1.cardinality).toEqual(2);
  });

  it('should check equality correctly', () => {
    expect(cc1.equals(cc1.copy())).toBeTrue();
    expect(cc1.equals(cc2)).toBeFalse();
  });

  it('should intersect correctly', () => {
    cc1.intersect(cc2);
    let expectedCc = new ColumnCombination(columnB);
    expect(cc1).toEqual(expectedCc);
  });

  it('should union correctly', () => {
    cc1.union(cc2);
    let expectedCc = new ColumnCombination(columnA, columnB, columnC);
    expect(cc1).toEqual(expectedCc);
  });

  it('should setminus correctly', () => {
    cc1.setMinus(cc2);
    let expectedCc = new ColumnCombination(columnA);
    expect(cc1).toEqual(expectedCc);
  });

  it('should check subset relation correctly', () => {
    expect(cc1.isSubsetOf(cc2)).toBeFalse();
    expect(cc1.isSubsetOf(cc1.copy())).toBeTrue();
    let ccA = new ColumnCombination(columnA);
    expect(cc1.isSubsetOf(ccA)).toBeFalse();
    expect(ccA.isSubsetOf(cc1)).toBeTrue();
  });

  it('should order columns correctly', () => {
    let priorPrio: number;
    cc1.inOrder().forEach((column, index) => {
      if (index != 0) {
        expect(column.prio).toBeGreaterThanOrEqual(priorPrio);
      }
      priorPrio = column.prio;
    });
  });
});
