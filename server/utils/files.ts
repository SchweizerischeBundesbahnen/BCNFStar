import { join, parse } from "path";

function getAbsoluteServerDir() {
  // if we are compiled javascript, we need to escape one more folder (the 'dist' folder)
  if (__dirname.endsWith("dist/utils")) return join(__dirname, "..", "..");
  else return join(__dirname, "..");
}
export const absoluteServerDir = getAbsoluteServerDir();

export function pathSplit(path: string): string[] {
  const result = parse(path);
  return [result["dir"], result["base"]];
}
