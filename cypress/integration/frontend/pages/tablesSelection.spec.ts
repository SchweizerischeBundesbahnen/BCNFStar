/// <reference types="cypress" />

describe("The table selection page", () => {
  beforeEach(() => {
    cy.visitFrontend();
    cy.contains("public").click();
  });

  it("renders", () => {
    cy.url().should("contain", Cypress.env("FRONTEND_BASEURL"));
  });

  it("displays all tables of the database", () => {
    cy.contains("nation_region_denormalized");
    cy.contains("denormalized_data");
    cy.contains("customer_orders_lineitem_denormalized");
    cy.contains("part_partsupp_supplier_denormalized");
  });

  it("displays all checkboxes unchecked by default", () => {
    cy.contains("nation_region_denormalized");
    cy.contains("denormalized_data");
    cy.contains("customer_orders_lineitem_denormalized");
    cy.contains("part_partsupp_supplier_denormalized");
  });

  it("has the Go button", () => {
    cy.get("button").contains("Go");
  });

  it("renders the normalize page when clicking on the Go button", () => {
    cy.contains("public").click();

    cy.contains("nation_region_denormalized").click();
    // cy.contains("denormalized_data").click();
    // cy.contains("customer_orders_lineitem_denormalized").click();
    cy.contains("part_partsupp_supplier_denormalized").click();
    cy.contains("Go").click();
    cy.url({ timeout: 10 * 60 * 1000 }).should("contain", "/edit-schema");
  });
});
