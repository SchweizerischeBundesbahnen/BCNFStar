import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { absoluteServerDir, initFile } from "../utils/files";

import { Mutex } from "async-mutex";
import { IIndexFileEntry } from "@/definitions/IIndexTableEntry";

/** Used to make sure that no two addToIndex/deleteFromIndex calls can happen simultaniously */
const mutex = new Mutex();

const indexFileLocation = join(
  absoluteServerDir,
  "metanome",
  "bcnfstar_results",
  "index.json"
);

export async function getIndexContent(): Promise<Array<IIndexFileEntry>> {
  await initFile(indexFileLocation, "[]");
  const contentString = await readFile(indexFileLocation, {
    encoding: "utf-8",
  });
  return JSON.parse(contentString);
}

/**
 * This should rarely be called directly, but via MetanomeAlgorithn.addToIndex!
 * It takes an entry and adds it to the index file once a lock could be aqcuired
 * @param entry
 * @returns Promise that resolves after file was edited
 */
export async function addToIndex(entry: IIndexFileEntry) {
  return mutex.runExclusive<void>(async () => {
    const content = await getIndexContent();
    content.push(entry);
    return writeFile(indexFileLocation, JSON.stringify(content));
  });
}

/**
 * Deletes this file from the metanome index file
 * ATTENTION: THIS WONT DELETE THE FILE ITSELF
 * This is done so that this operation is as atomic as
 * possible, and is either completely clears or completely
 * fails, but doen't leave corrupted state. The calling context
 * is responsible for making sure both actions succeed
 * @param fileName name of the file to be deleted (without folders)
 * @returns Promise. Resolves to true if something was deleted, false otherwise
 */
export async function deleteFromIndex(fileName: string): Promise<boolean> {
  return mutex.runExclusive<boolean>(async () => {
    const content = await getIndexContent();
    const toBeRemoved = content.find((entry) => entry.fileName == fileName);
    await writeFile(
      indexFileLocation,
      JSON.stringify(content.filter((entry) => entry != toBeRemoved))
    );
    return !!toBeRemoved;
  });
}
