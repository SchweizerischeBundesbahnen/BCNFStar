/// <reference types="cypress" />

describe("The tables page", () => {
  it("should render without error", () => {
    cy.log(JSON.stringify(Cypress.env()));
    cy.visit(Cypress.env("FRONTEND_BASEURL") + "/table-selection");
    // contains asserts that a element with the content exists and selects it
    cy.contains("table_1").click();
    cy.contains("normalize works!");
  });
});
