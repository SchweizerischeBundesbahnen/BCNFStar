export default interface ISchemaMatchingRequest {
  srcSql: string;
  targetSql: string;
  // list of words meaning the same (abbreviations or synonyms) in the form `term1version1,term1version2\nterm2version1,term2version2`
  thesaurus?: string;
}
