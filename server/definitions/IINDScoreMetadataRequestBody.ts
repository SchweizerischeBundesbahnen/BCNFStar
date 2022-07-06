import { IColumnRelationship } from "./IRelationship";
import ITable from "./ITable";

export default interface IINDScoreMetadataRequestBody {
  tableReferencing: ITable;
  tableReferenced: ITable;
  columnRelationships: IColumnRelationship[];
}
