import { sqlUtils } from "@/db";
import { DbmsType } from "@/db/SqlUtils";
import { IColumnIdentifier } from "@/definitions/IInclusionDependency";
import { splitTableString } from "@/utils/databaseUtils";

/**
 * This function takes a metanome result column identifier, which just
 * includes a table- and columnIdentifier, and adds a schemaIdentifier to it
 * @param cId column identifier obtained from metanome output
 * @param tablesWithSchema list of tables metanome was executed on
 */
export function splitTableIdentifier(
    cId: IColumnIdentifier,
    tablesWithSchema: string[]
  ) {
    // Depending on the database type, tableIdentifier might contain both schema-
    // and table name, or just the table name
    let tableWithSchema: string;
    if ([DbmsType.mssql, DbmsType.synapse, DbmsType.spark].includes(sqlUtils.getDbmsName()))
      tableWithSchema = cId.tableIdentifier;
    else if (sqlUtils.getDbmsName() == DbmsType.postgres)
      tableWithSchema = tablesWithSchema.find((entry) => {
        const entryTable = splitTableString(entry)[1];
        return cId.tableIdentifier == entryTable;
      });
    else throw Error("unknown dbms type");
  
    cId.schemaIdentifier = splitTableString(tableWithSchema)[0];
    cId.tableIdentifier = splitTableString(tableWithSchema)[1];
  }