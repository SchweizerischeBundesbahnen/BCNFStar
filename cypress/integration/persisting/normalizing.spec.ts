/// <reference types="cypress" />

describe("The persist-button should create executable SQL", () => {
  const normalized_schema = "test_schema_normalized";
  const denormalized_schema = "test_schema_denormalized";
  let columns = [];

  it("creates executable SQL", () => {
    cy.visit(Cypress.env("FRONTEND_BASEURL") + "/#/metanome-results");
    cy.visitFrontend();
    cy.selectSpecificTablesAndGo("public", ["nation_region_denormalized"]);

    cy.loadMetanomeConfigAndOk();
    cy.get('[data-cy="graph-element-columns"]')
      .invoke("text")
      .then((text) => columns.push(text.trim().split(/[ ,]+/)));

    cy.get("button").contains("Auto-normalize all tables").click();

    cy.createSchema(normalized_schema);
  });

  it("creates tables", () => {
    const normalizedTables = ["nation_region_denormalized", "r_regionkey"];

    cy.visitFrontend();
    cy.contains(normalized_schema);
    cy.selectSpecificTablesAndGo(normalized_schema, normalizedTables);
    cy.loadMetanomeConfigAndOk();
  });

  it("creates keys", () => {
    cy.get(
      '[data-cy="graph-element-columns"][class="col-7 ellipsis pk"]'
    ).should("have.length", 1);
    cy.get(
      '[data-cy="graph-element-columns"][class="col-7 ellipsis pk"]'
    ).should("contain", "r_regionkey");
    cy.get(".joint-tool").should("have.length", 1);
  });

  it("denormalized table contains same data as initial table", () => {
    cy.get(".joint-tool").first().click();
    cy.contains("Ok").click();

    cy.createSchema(denormalized_schema);

    const Sql = `SELECT COUNT(*) FROM (SELECT ${columns.join(
      ","
    )} FROM public.nation_region_denormalized EXCEPT SELECT ${columns.join(
      ","
    )} FROM ${denormalized_schema}.nation_region_denormalized) AS x`;

    cy.task("dbQuery", { query: Sql }).then((response) =>
      expect(response[0].count).to.equal("0")
    );
  });

  // TODO maybe we should think about transactions?
  after("database cleanup", () => {
    cy.executeSql(`DROP SCHEMA IF EXISTS ${normalized_schema} CASCADE`);
    cy.executeSql(`DROP SCHEMA IF EXISTS ${denormalized_schema} CASCADE`);
  });
});
