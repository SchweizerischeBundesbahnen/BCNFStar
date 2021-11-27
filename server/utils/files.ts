import { dirname } from "path";

function getAbsoluteServerDir() {
  return dirname(__dirname);
}
export const absoluteServerDir = getAbsoluteServerDir();