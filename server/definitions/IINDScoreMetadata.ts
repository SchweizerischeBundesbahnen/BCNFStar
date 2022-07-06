//for reference see Rostin, Albrecht, Bauckmann, Naumann, Leser: A Machine Learning Approach to Foreign Key Discovery
export default interface IINDScoreMetadata {
  distinctDependantValues: number;
  coverage: number;
  valueLengthDiff: number;
  outOfRange: number;
  tableSizeRatio: number;
}
