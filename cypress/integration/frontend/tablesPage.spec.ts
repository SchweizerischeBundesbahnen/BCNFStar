/// <reference types="cypress" />

describe("The tables page", () => {
  it("should be able to navigate to the normalize page", () => {
    cy.visit(Cypress.env("FRONTEND_BASEURL") + "/table-selection");
    cy.url().should("contain", "/table-selection");
    // contains asserts that a element with the content exists and selects it
    cy.contains("Example").click();
    cy.contains("ExampleTable");
    cy.url().should("contain", "/normalize");
  });
});
