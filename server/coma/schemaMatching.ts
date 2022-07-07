import ISchemaMatchingResponse from "@/definitions/ISchemaMatchingResponse";
import { ensureDirExists } from "@/utils/files";
import { exec } from "child_process";
import { randomUUID } from "crypto";
import { readFile, rm, writeFile } from "fs/promises";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 *
 * @param srcTables in format schema.tables
 * @param trgTables in format schema.tables
 * @param thesaurus explanation: see ISchemaMatchingRequest.ts
 */
export default async function getSchemaMatching(
  srcSql: string,
  targetSql: string,
  thesaurus?: string
): Promise<Array<ISchemaMatchingResponse>> {
  await ensureDirExists("coma/schemas");
  const srcFile = await createFile(srcSql);
  const targetFile = await createFile(targetSql);
  await ensureDirExists("coma/results");
  const resultFile = "coma/results/" + randomUUID() + ".json";
  if (!thesaurus)
    await execAsync(
      `java -cp "coma/*" de.wdilab.coma.integration.COMA_API ${resultFile} ${srcFile} ${targetFile}`
    );
  else {
    // synonyms don't seem to do much, so just put everything into abbrevs
    const synonyms = await createFile("");
    const abbrevs = await createFile(thesaurus);
    await execAsync(
      `java -cp "coma/*" de.wdilab.coma.integration.COMA_API ${resultFile} ${srcFile} ${targetFile} ${abbrevs} ${synonyms}`
    );
    for (const file of [synonyms, abbrevs]) rm(file);
  }
  const escaped: Array<ISchemaMatchingResponse> = JSON.parse(
    await readFile(resultFile, { encoding: "utf-8" })
  );

  for (const file of [srcFile, targetFile, resultFile]) rm(file);
  return escaped.map((entry) => {
    return {
      similarity: entry.similarity,
      source: removeEscapeSymbols(entry.source),
      target: removeEscapeSymbols(entry.target),
    };
  });
}

/**
 *
 * @param schema
 * @param table
 * @returns file name
 */
async function createFile(content: string): Promise<string> {
  const filename = "coma/schemas/" + randomUUID() + ".sql";
  await writeFile(filename, content, { encoding: "utf-8" });
  return filename;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

function replaceAll(str, find, replace) {
  return str.replace(new RegExp(escapeRegExp(find), "g"), replace);
}

function removeEscapeSymbols(str: string) {
  let result = replaceAll(str, "]", "");
  result = replaceAll(result, "[", "");
  result = replaceAll(result, '"', "");
  return result;
}
