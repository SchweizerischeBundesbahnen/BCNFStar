import ITablePage from "@/definitions/ITablePage";
import ITablePageQueryParameter from "@/definitions/ITablePageQueryParameter";
import { Request, Response } from "express";
import { sqlUtils } from "../db";
import { validationResult } from "express-validator";
export async function getTablePage(
  req: Request<{}, {}, {}, ITablePageQueryParameter>,
  res: Response
): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.mapped() });
      return;
    }
    const params = req.query as ITablePageQueryParameter;

    const result: ITablePage = await sqlUtils.getTablePage(
      params.table,
      params.schema,
      params.offset,
      params.limit
    );

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Could not get table page" });
  }
}
