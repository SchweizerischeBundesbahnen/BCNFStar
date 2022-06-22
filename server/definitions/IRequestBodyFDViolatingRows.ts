export default interface IRequestBodyFDViolatingRows {
  sql: string;
  lhs: Array<string>;
  rhs: Array<string>;
  offset: number;
  limit: number;
}
