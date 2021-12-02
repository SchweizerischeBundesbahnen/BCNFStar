import { dirname, basename, parse } from "path";

function getAbsoluteServerDir() {
  return dirname(__dirname);
}
export const absoluteServerDir = getAbsoluteServerDir();

export function pathSplit(path : string) : string[]  {
  const result = parse(path);
  return [result['dir'], result['base']];
}