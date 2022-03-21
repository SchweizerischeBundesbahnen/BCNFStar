/// <reference types="cypress" />

describe("The app routing", () => {
  it("should be render table selection component", () => {
    cy.visitFrontend();
    cy.url().should("contain", Cypress.env("FRONTEND_BASEURL"));
  });

  it("should be render normalize component", () => {
    cy.visit(Cypress.env("FRONTEND_BASEURL"));
    cy.contains("public").click();
    cy.contains("customer_orders_lineitem_denormalized").click();
    cy.contains("Go").click();
    cy.url().should(
      "contain",
      Cypress.env("FRONTEND_BASEURL") + "/edit-schema"
    );
  });

  it("should be render database component when calling missing url", () => {
    cy.visit(Cypress.env("FRONTEND_BASEURL") + "/wrong/path");
    cy.url().should("contain", Cypress.env("FRONTEND_BASEURL"));
  });
});
