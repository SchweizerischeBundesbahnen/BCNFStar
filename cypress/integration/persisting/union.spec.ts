/// <reference types="cypress" />

describe("The persist-button should create executable SQL, that UNIONs two tables", () => {
  const unionedSchema = "test_schema_unioned";
  let columns: Array<string> = [];

  it.only("creates executable SQL", () => {
    cy.visitFrontend();
    cy.selectSpecificTablesAndGo("public", [
      "nation_region_denormalized",
      "part_partsupp_supplier_denormalized",
    ]);
    cy.unionTables(
      "public.nation_region_denormalized",
      "public.part_partsupp_supplier_denormalized",
      []
    );
  });

  it("union table with itself results in same rowcount", () => {});

  it("allows table union with different datatypes", () => {});

  // TODO maybe we should think about transactions?
  after("database cleanup", () => {
    cy.executeSql(`DROP SCHEMA IF EXISTS ${unionedSchema} CASCADE`);
  });
});
