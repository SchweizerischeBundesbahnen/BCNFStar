import { sqlUtils } from "../db";
import ITableHead from "@/definitions/ITableHead";
import { Request, Response, RequestHandler } from "express";

export default function getTableHeadFromNameFunction(): RequestHandler {
  async function getTableHeadFromName(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      if (!req.query.table_name || !req.query.schema_name) {
        res
          .status(400)
          .json({ error: "Must specify table_name and schema_name" });
        return;
      }

      const query_result = await sqlUtils.getTableHead(
        req.query.schema_name as string,
        req.query.table_name as string
      );

      if ("error" in query_result) {
        res.status(404).json(query_result);
        return;
      }

      const result: ITableHead = {
        attributes: query_result.columns,
        rows: query_result.data,
      };
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(502).json({ error });
    }
  }

  return getTableHeadFromName;
}
