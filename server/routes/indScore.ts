import { Request, Response } from "express";
import { sqlUtils } from "@/db";
import ITable from "@/definitions/ITable";
import { IColumnRelationship } from "@/definitions/IRelationship";
import IINDScoreMetadataRequestBody from "@/definitions/IINDScoreMetadataRequestBody";
import IINDScoreMetadata from "@/definitions/IINDScoreMetadata";
import { isAwaitExpression } from "typescript";

export default async function getIndScoreMetadata(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const body: IINDScoreMetadataRequestBody =
      req.body as IINDScoreMetadataRequestBody;

    let distinctValues: number = await sqlUtils.getDistinctValuesForCCCount(
      body.tableReferencing.schemaName,
      body.tableReferencing.name,
      body.columnRelationships.map((rel) => rel.referencingColumn)
    );
    let coverage: number = await sqlUtils.getCoverageForIND(
      body.tableReferencing,
      body.tableReferenced,
      body.columnRelationships
    );
    let avgReferencingLength: number =
      await sqlUtils.getAverageLengthDistinctValuesForCC(
        body.tableReferencing.schemaName,
        body.tableReferencing.name,
        body.columnRelationships.map((rel) => rel.referencingColumn)
      );
    let avgReferencedLength: number =
      await sqlUtils.getAverageLengthDistinctValuesForCC(
        body.tableReferenced.schemaName,
        body.tableReferenced.name,
        body.columnRelationships.map((rel) => rel.referencedColumn)
      );
    let valueLengthDiff: number = Math.abs(
      avgReferencedLength - avgReferencingLength
    );
    console.log(
      avgReferencingLength + " " + avgReferencedLength + ": " + valueLengthDiff
    );
    let rowsReferencing: number = await (
      await sqlUtils.getTableRowCount(
        body.tableReferencing.name,
        body.tableReferencing.schemaName
      )
    ).groups;
    let rowsReferenced: number = await (
      await sqlUtils.getTableRowCount(
        body.tableReferenced.name,
        body.tableReferenced.schemaName
      )
    ).groups;
    let outOfRange: number = await sqlUtils.getOutOfRangeValuePercentage(
      body.tableReferencing,
      body.tableReferenced,
      body.columnRelationships
    );

    let result: IINDScoreMetadata = {
      distinctDependantValues: distinctValues,
      coverage: coverage,
      valueLengthDiff: valueLengthDiff,
      tableSizeRatio: rowsReferencing / rowsReferenced,
      outOfRange: outOfRange,
    };

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Could not get metadata for ind score" });
  }
}
