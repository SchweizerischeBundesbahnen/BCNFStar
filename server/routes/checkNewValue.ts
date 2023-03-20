import { sqlUtils } from "@/db";
import IRequestBodyNewValue from "@/definitions/IRequestBodyNewValue";
import { isIRequestBodyNewValue } from "@/definitions/IRequestBodyNewValue.guard";
import { Request, Response } from "express";
import { validationResult } from "express-validator";

export default async function checkNewValue(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.mapped() });
      return;
    }

    if (!isIRequestBodyNewValue(req.body)) {
      res.status(422).json({ errors: "Invalid request body." });
      return;
    }

    res
      .status(200)
      .json(await sqlUtils.testNewValue(req.body as IRequestBodyNewValue));
  } catch (error) {
    console.error(error);
    res
      .status(502)
      .json({ error: "Error while trying to test uniqueness of a new value." });
  }
}
