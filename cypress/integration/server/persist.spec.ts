/// <reference types="cypress" />

describe("The persist-button should create a file, that SQL, which creates the desired schema", () => {
  beforeEach(() => {
    cy.visit(Cypress.env("FRONTEND_BASEURL") + "/#/metanome-results");
    cy.visitFrontend();
    cy.selectSpecificTablesAndGo(["part_partsupp_supplier_denormalized"]);
    cy.loadMetanomeConfigAndOk();
    cy.get("button").contains("Auto-normalize all tables").click();

    cy.get("input").type("test_schema");
    cy.get("button").contains("Download").click();
  });

  it("creates table", () => {
    cy.readFile("./cypress/downloads/test_schema.sql").then((SQL) =>
      cy.executeSql(SQL)
    );
    cy.visitFrontend();
    cy.contains("l_shipdate");
  });

  after("deletes tables", () => {
    cy.executeSql("DROP SCHEMA test_schema CASCADE");
  });
});
