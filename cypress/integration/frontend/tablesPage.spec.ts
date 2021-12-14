/// <reference types="cypress" />

describe("The tables page", () => {
  beforeEach(() => {
    cy.visit(Cypress.env("FRONTEND_BASEURL"), {
      headers: {
        "Accept-Encoding": "gzip, deflate, br",
      },
    });
    cy.contains("Default Connection").click();
  });
  it("should be able to navigate to the normalize page", () => {
    cy.url().should("contain", "/table-selection");
    // contains asserts that a element with the content exists and selects it
    cy.contains("public.nation_region_denormalized").click();
    cy.contains("Keys");
    cy.contains("Functional Dependencies");
    cy.url().should("contain", "/normalize/");
    cy.url().should("contain", "/normalize/public.nation_region_denormalized");
  });
});
