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

export function getStaticDir() {
  return join(
    absoluteServerDir,
    "..",
    "frontend",
    "dist",
    global.__coverage__ ? "bcnfstar-coverage" : "bcnfstar"
  );
}

/**
 * Splits string into line strings and removes the last one if empty
 * @param content String including LF or CRLF line endings
 * @returns lines as an array of strings
 */
export function splitlines(content: string): Array<string> {
  let lines: Array<string>;
  if (content.includes("\r")) lines = content.split("\r\n");
  else lines = content.split("\n");
  if (!lines[lines.length - 1]) lines.pop();
  return lines;
}
