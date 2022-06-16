import { sqlUtils } from "@/db";
import { IRequestBodyUnionedKeys } from "@/definitions/IUnionedKeys";
import { isIRequestBodyUnionedKeys } from "@/definitions/IUnionedKeys.guard";
import { Request, Response } from "express";
import { validationResult } from "express-validator";

export default async function checkUnionedKeys(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.mapped() });
      return;
    }

    if (!isIRequestBodyUnionedKeys(req.body)) {
      res.status(422).json({ errors: "Invalid request body." });
      return;
    }

    res
      .status(200)
      .json(
        await sqlUtils.testKeyUnionability(req.body as IRequestBodyUnionedKeys)
      );
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Error while trying to test type casting." });
  }
}
