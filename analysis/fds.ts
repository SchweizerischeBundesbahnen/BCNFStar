import { readFile } from "fs/promises";
import IFunctionalDependency from "../server/definitions/IFunctionalDependency";

// give filename as first argument
(async function () {
  for (const filename of process.argv.slice(2)) {
    console.log(filename);
    await calculateFdStatistics(filename);
  }
})();

async function calculateFdStatistics(filename: string) {
  const lhsCounts = {};
  const rhsCounts = {};
  const fds: { lhs: string[]; rhs: string[] }[] = [];
  const fileContent = await readFile(filename, { encoding: "utf-8" });
  const content: Array<IFunctionalDependency> = JSON.parse(fileContent);
  for (const fd of content) {
    lhsCounts[fd.lhsColumns.length] = lhsCounts[fd.lhsColumns.length]
      ? lhsCounts[fd.lhsColumns.length] + 1
      : 1;
    rhsCounts[fd.rhsColumns.length] = rhsCounts[fd.rhsColumns.length]
      ? rhsCounts[fd.rhsColumns.length] + 1
      : 1;
  }
  console.log("rh");
  console.table(rhsCounts);
  console.log("lh");
  console.table(lhsCounts);
  // console.log(fds.filter(v => v.rhs.length == 31))
}
