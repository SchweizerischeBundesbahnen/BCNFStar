import { CustomValidator } from "express-validator";
import { sqlUtils } from "@/db";

export function isValidFileName(): CustomValidator {
  return (fileName: string) => {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}.json$/i.test(
        fileName
      )
    ) {
      return Promise.reject("Invalid Filename");
    }
    return true;
  };
}

export function isValidDatatype(): CustomValidator {
  return async (datatype: string) => {
    const patterns: RegExp[] = [
      /^character varying \(\d+\)$/i,
      /^varchar\s*\(max\)$/i,
      /^nvarchar\s*\(\d+\)$/i,
      /^varchar\s*\(\d+\)$/i,
      /^decimal\s*\(\d+,\d+\)$/i,
      /^numeric\s*\(\d+,\d+\)$/i,
      /^char\s*\(\d+,\d+\)$/i,
      /^integer$/i,
      /^datetime$/i,
    ];
    const serverDatatypes: string[] = await sqlUtils.getDatatypes();
    if (
      !serverDatatypes.includes(datatype) &&
      patterns.every((pattern) => pattern.test(datatype) == false)
    ) {
      return Promise.reject("Invalid Datatype");
    }
    return true;
  };
}

export function isValidSql(): CustomValidator {
  return (sqlString: string) => {
    const sql = sqlString.toLowerCase().trim();
    const forbiddenSubstrings = [
      " --",
      " drop ",
      " exec ",
      " view ",
      " alter ",
    ];

    if (
      forbiddenSubstrings.every((str) => !sql.toLocaleLowerCase().includes(str))
    ) {
      return Promise.reject("This SQL isn't safe to execute");
    }
    if (sql.length == 0) {
      return Promise.reject("This SQL isn't safe to execute");
    }
    return true;
  };
}
