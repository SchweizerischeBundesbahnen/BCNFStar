import { dirname } from "path";
import { access } from "fs/promises";
import { constants } from "fs";

function getPkgJsonDir() {
//   for (const path of module.paths) {
//     const prospectivePkgJsonDir = dirname(path);
//     await access(path, constants.F_OK);
//     return prospectivePkgJsonDir;
//   }
  return dirname(dirname(require.main.filename));
  throw new Error("Could not find package.json");
}

export const pkgJsonDir = getPkgJsonDir();