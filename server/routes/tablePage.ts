import ITablePage from "@/definitions/ITablePage";
import { Request, Response } from "express";
import { sqlUtils } from "../db";

export async function getTablePage(req: Request, res: Response): Promise<void> {
  try {
    if (!req.query.limit) {
      res.status(400).json({ error: "Must specify limit" });
      return;
    }

    const schema = req.query.schema;
    const tablename = req.query.table;
    const limit: number = +req.query.limit;
    const offset: number = +req.query.offset;

    const result: ITablePage = await sqlUtils.getTablePage(
      tablename.toString(),
      schema.toString(),
      offset,
      limit
    );

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Could not get table page" });
  }
}
