/// <reference types="cypress" />

describe("The app routing", () => {
  it("renders the table selection component", () => {
    cy.visitFrontend();
    cy.url().should("contain", Cypress.env("FRONTEND_BASEURL"));
  });

  it("renders the normalize component", () => {
    cy.visitFrontend();
    cy.selectTablesAndGo();
    cy.url().should(
      "contain",
      Cypress.env("FRONTEND_BASEURL") + "/#/edit-schema"
    );
  });

  it("renders the table selection component when calling missing url", () => {
    cy.visit(Cypress.env("FRONTEND_BASEURL") + "/#/wrong/path", {
      failOnStatusCode: false,
    });
    cy.url().should("equal", Cypress.env("FRONTEND_BASEURL") + "/#/");
  });
});
