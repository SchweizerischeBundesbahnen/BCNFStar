import { readFile } from "fs/promises";
import { splitlines } from "../server/utils/files";

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
  for (const fdString of splitlines(fileContent)) {
    if (!fdString) continue;
    let [lhsString, rhsString] = fdString.split("] --> ");
    lhsString = lhsString.substring(1);
    const lhColumns = lhsString.split(", ");
    const rhColumns = rhsString.split(", ");
    fds.push({ lhs: lhColumns, rhs: rhColumns });
    lhsCounts[lhColumns.length] = lhsCounts[lhColumns.length]
      ? lhsCounts[lhColumns.length] + 1
      : 1;
    rhsCounts[rhColumns.length] = rhsCounts[rhColumns.length]
      ? rhsCounts[rhColumns.length] + 1
      : 1;
  }
  console.log("rh");
  console.table(rhsCounts);
  console.log("lh");
  console.table(lhsCounts);
  // console.log(fds.filter(v => v.rhs.length == 31))
}
