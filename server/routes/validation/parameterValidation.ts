import { CustomValidator } from "express-validator";

export default function isValidFileName(): CustomValidator {
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
