/// <reference types="cypress" />

describe("The persist-button should create a file, that SQL, which creates the desired schema", () => {
  beforeEach(() => {
    cy.visit(Cypress.env("FRONTEND_BASEURL") + "/#/metanome-results");
    cy.visitFrontend();
    cy.selectTablesAndGo();
  });

  it("creates table", () => {
    cy.readFile("C:\\Users\\Paul\\Downloads\\finalSKTest.sql").then((SQL) =>
      cy.executeSql(SQL)
    );
    // cy.executeSql(`CREATE SCHEMA IF NOT EXISTS finalSKTest; DROP TABLE IF EXISTS finalSKTest.l_shipdate CASCADE;
    //  CREATE TABLE finalSKTest.l_shipdate (lsd INT GENERATED ALWAYS AS IDENTITY, l_linestatus varchar(1) NULL, l_shipdate date NOT NULL);
    // `);
    cy.visitFrontend();
    cy.contains("l_shipdate");
  });
});
