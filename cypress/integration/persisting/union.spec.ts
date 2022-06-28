/// <reference types="cypress" />

describe("The persist-button should create executable SQL, that UNIONs two tables", () => {
  const unionedSchema = "test_schema_unioned";
  let columns: Array<string> = [];

  beforeEach(() => {
    cy.visitFrontend();
    cy.selectSpecificTablesAndGo("public", [
      "nation_region_denormalized",
      "part_partsupp_supplier_denormalized",
    ]);

    cy.loadMetanomeConfigAndOk();
  });

  it("creates unioned table named after first selected Table", () => {
    cy.unionTables(
      "public.nation_region_denormalized",
      "public.part_partsupp_supplier_denormalized",
      [
        ["n_nationkey", "ps_partkey"],
        ["n_name", "p_brand"],
        ["n_regionkey", "ps_suppkey"],
      ]
    );
    cy.get(".table-head-title").should("have.length", 1);
    cy.get(".table-head-title").contains("public.nation_region_denormalized");
  });

  it("creates executable SQL", () => {
    cy.unionTables(
      "public.nation_region_denormalized",
      "public.part_partsupp_supplier_denormalized",
      [
        ["n_nationkey", "ps_partkey"],
        ["n_name", "p_mfgr"],
        ["n_regionkey", "ps_suppkey"],
      ]
    );
    cy.createSchema(unionedSchema);

    cy.visitFrontend();
    cy.selectSpecificTablesAndGo(unionedSchema, ["nation_region_denormalized"]);
  });

  it("null columns work", () => {
    cy.unionTables(
      "public.nation_region_denormalized",
      "public.part_partsupp_supplier_denormalized",
      [
        ["n_nationkey", "ps_partkey"],
        ["n_name", "Fill Column with NULL"],
        ["Fill Column with NULL", "ps_suppkey"],
      ]
    );
    cy.createSchema(unionedSchema);

    cy.visitFrontend();
    cy.selectSpecificTablesAndGo(unionedSchema, ["nation_region_denormalized"]);
  });

  it("allows using same column multiple times", () => {
    cy.unionTables(
      "public.nation_region_denormalized",
      "public.part_partsupp_supplier_denormalized",
      [
        ["n_nationkey", "ps_partkey"],
        ["n_name", "p_mfgr"],
        ["n_regionkey", "ps_partkey"],
      ]
    );
    cy.createSchema(unionedSchema);

    cy.visitFrontend();
    cy.selectSpecificTablesAndGo(unionedSchema, ["nation_region_denormalized"]);
  });

  // TODO maybe we should think about transactions?
  afterEach("database cleanup", () => {
    const downloadsFolder = Cypress.config("downloadsFolder");
    cy.task("deleteFolder", downloadsFolder);
    cy.executeSql(`DROP SCHEMA IF EXISTS ${unionedSchema} CASCADE`);
  });
});
