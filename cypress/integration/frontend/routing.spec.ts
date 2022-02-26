/// <reference types="cypress" />

describe("The app routing", () => {
  it("should be render database selection component", () => {
    cy.visitFrontend();
    cy.url().should("contains", Cypress.env("FRONTEND_BASEURL"));
  });

  it("should be render table selection component", () => {
    cy.visit(Cypress.env("FRONTEND_BASEURL") + "/table-selection");
    cy.url().should(
      "contains",
      Cypress.env("FRONTEND_BASEURL") + "/table-selection"
    );
  });

  it("should be render normalize component", () => {
    cy.visit(Cypress.env("FRONTEND_BASEURL") + "/table-selection");
    cy.contains("public.customer_orders_lineitem_denormalized").click();
    cy.contains("Go").click();
    cy.url().should("contains", Cypress.env("FRONTEND_BASEURL") + "/normalize");
  });

  it("should be render database component when calling missing url", () => {
    cy.visit(Cypress.env("FRONTEND_BASEURL") + "/wrong/path");
    cy.url().should("contains", Cypress.env("FRONTEND_BASEURL"));
  });
});
