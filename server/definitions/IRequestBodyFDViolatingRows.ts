export default interface IRequestBodyFDViolatingRows {
  schema: string;
  table: string;
  lhs: Array<string>;
  rhs: Array<string>;
  offset: number;
  limit: number;
}
