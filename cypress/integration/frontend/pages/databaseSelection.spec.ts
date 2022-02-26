/// <reference types="cypress" />

describe("Check database selection page", () => {
  beforeEach(() => {
    cy.visitFrontend();
  });

  it("should be render the database selection page", () => {
    cy.url().should("contain", Cypress.env("FRONTEND_BASEURL"));
  });

  it("should be show a form to select database", () => {
    cy.contains("Select a database connection:");
    cy.contains("Database");
    cy.contains("Username");
    cy.contains("Password");
    cy.contains("Submit");
    cy.contains("Default Connection");
  });

  it("should be click default connection button and render table selection page", () => {
    cy.contains("Default Connection").click();
    cy.url().should("contain", "/table-selection");
  });
});
