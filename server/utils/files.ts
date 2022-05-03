import { access, mkdir, writeFile } from "fs/promises";
import { dirname, join, parse } from "path";

function getAbsoluteServerDir() {
  // if we are compiled javascript, we need to escape one more folder (the 'dist' folder)
  if (__dirname.endsWith("dist/utils")) return join(__dirname, "..", "..");
  else return join(__dirname, "..");
}
export const absoluteServerDir = getAbsoluteServerDir();

/**
 * @returns Absolute path of the frontend files that shall be served statically
 */
export function getStaticDir(): string {
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

/**
 * Creates a file and the containing folders if they don't exist
 * @param path path of the file
 * @param content content that should be written to the file if it didn't exist
 */
export async function initFile(path: string, content: string = "") {
  try {
    await access(dirname(path));
  } catch (e) {
    await mkdir(dirname(path), { recursive: true });
  }
  try {
    await access(path);
  } catch (e) {
    await writeFile(path, content);
  }
}
