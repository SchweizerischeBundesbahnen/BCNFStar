export default interface IRowCounts {
  // how many entries are represented by the route. one row can
  // represent multiple rows due to GROUP BY statements
  entries: number;
  // how many rows can be returned by the route
  groups: number;
}
