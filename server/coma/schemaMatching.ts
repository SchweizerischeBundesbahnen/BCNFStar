import { sqlUtils } from "@/db";
import { DbmsType } from "@/db/SqlUtils";
import ISchemaMatchingResponse from "@/definitions/ISchemaMatchingResponse";
import { ensureDirExists } from "@/utils/files";
import { exec } from "child_process";
import { randomUUID } from "crypto";
import { readFile, rm } from "fs/promises";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 *
 * @param srcTables with schema.
 * @param trgTables
 */
export default async function getSchemaMatching(
  srcSchemaAndTables: string[],
  targetSchemaAndTables: string[]
) {
  if (sqlUtils.getDbmsName() == DbmsType.mssql)
    throw Error("Not supported on mssql!");
  await ensureDirExists("coma/schemas");
  const srcFile = await createSchemaDump(srcSchemaAndTables);
  const targetFile = await createSchemaDump(targetSchemaAndTables);
  await ensureDirExists("coma/results");
  const resultFile = "coma/results/" + randomUUID() + ".json";
  await execAsync(
    `java -cp "coma/*" de.wdilab.coma.integration.COMA_API ${srcFile} ${targetFile} ${resultFile}`
  );
  const result: Array<ISchemaMatchingResponse> = JSON.parse(
    await readFile(resultFile, { encoding: "utf-8" })
  );

  for (const file of [srcFile, targetFile, resultFile]) await rm(file);
  return result;
}

/**
 *
 * @param schema
 * @param table
 * @returns file name of pg_dump result
 */
async function createSchemaDump(schemaAndTables: string[]): Promise<string> {
  const filename = "coma/schemas/" + randomUUID() + ".sql";
  const result = await execAsync(
    `pg_dump -d ${
      process.env.DB_DATABASE
      // } -h ${process.env.DB_HOST
      // } -p ${process.env.DB_PORT
      // } -U ${process.env.DB_USER
      // } -W ${process.env.DB_PASSWORD
    } -f ${filename} -t ${schemaAndTables.join(" -t ")} -sx`
  );

  return filename;
}
