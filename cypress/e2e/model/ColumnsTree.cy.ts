import Column from "../../../frontend/src/model/schema/Column";
import ColumnCombination from "../../../frontend/src/model/schema/ColumnCombination";
import ColumnsTree from "../../../frontend/src/model/schema/ColumnsTree";
import Table from "../../../frontend/src/model/schema/Table";

describe("ColumnsTree", () => {
  let columnsTree = new ColumnsTree<string>();
  let [a, b, c, d] = Table.fromColumnNames(["a", "b", "c", "d"], "t").columns;

  getPossibleSubsets([a, b, c, d])
    .map(toCC)
    .forEach((cc) => {
      columnsTree.add(cc.columnNames().join(), cc);
    });

  it("allows to access single elements", () => {
    expect(columnsTree.get(toCC([d, a, c]))).to.equal("a,c,d");
  });

  it("can have elements for empty cc", () => {
    let columnsTreeLocal = new ColumnsTree<string>();
    expect(columnsTreeLocal.getAll()).to.deep.eq([]);
    columnsTreeLocal.add("", new ColumnCombination());
    expect(columnsTreeLocal.getAll()).to.deep.eq([""]);
  });

  it("returns all", () => {
    expect(columnsTree.getAll())
      .to.have.length(16)
      .and.to.have.members(getExpectedMembers(a, b, c, d));
  });

  it("returns subsets", () => {
    expect(columnsTree.getSubsets(toCC([a, b, d])))
      .to.have.length(8)
      .and.to.have.members(getExpectedMembers(a, b, d));
  });

  it("is order independent", () => {
    expect(columnsTree.getSubtree(toCC([d, b])).getAll())
      .to.have.length(4)
      .and.to.have.members(getExpectedMembers(b, d));
  });

  it("returns subtrees", () => {
    expect(columnsTree.getSubtree(toCC([b, c, d])).getAll())
      .to.have.length(8)
      .and.to.have.members(getExpectedMembers(b, c, d));
  });

  it("can handle subtrees of subtrees", () => {
    expect(
      columnsTree
        .getSubtree(toCC([d, b, c]))
        .getSubtree(toCC([a, d]))
        .getAll()
    ).to.have.members(["d", ""]);
  });

  it("returns subtrees that don't modify the original when changed", () => {
    const subtree = columnsTree.getSubtree(toCC([a, c]));
    subtree.add("i'm different", toCC([a, b]));
    expect(subtree.getAll())
      .to.have.length(5)
      .and.to.include.members(getExpectedMembers(a, c))
      .and.to.include("i'm different");
    expect(columnsTree.getAll()).not.to.include("i'm different");
  });
});

/**Attention: order is important here for correct strings to be generated */
function getExpectedMembers(...columns: Column[]): Array<string> {
  return getPossibleSubsets(columns.map((c) => c.name)).map((columns) =>
    columns.join()
  );
}

/**
 * @param arr an arbitrary array
 * @returns an arry of all possible subarrays of arr, including the
 *          empty array and the one containing all members
 */
function getPossibleSubsets<T>(arr: Array<T>): Array<Array<T>> {
  const result: Array<Array<T>> = [];
  const numberOfSubsets = 2 ** arr.length;
  for (let i = 0; i < numberOfSubsets; i++) {
    const subset: Array<T> = [];
    arr.forEach((el, index) => {
      if ((2 ** index) & i) subset.push(el);
    });
    result.push(subset);
  }
  return result;
}

function toCC(columns: Column[]): ColumnCombination {
  const cc = new ColumnCombination();
  columns.forEach((c) => cc.add(c));
  return cc;
}
