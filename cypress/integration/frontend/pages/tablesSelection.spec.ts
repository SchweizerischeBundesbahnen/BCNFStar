/// <reference types="cypress" />

describe("The table selection page", () => {
  beforeEach(() => {
    cy.visitFrontend();
    cy.contains("public").click();
  });

  it("should be rendered", () => {
    cy.url().should("contain", Cypress.env("FRONTEND_BASEURL"));
  });

  it("should display all tables of the database", () => {
    cy.contains("nation_region_denormalized");
    cy.contains("denormalized_data");
    cy.contains("customer_orders_lineitem_denormalized");
    cy.contains("part_partsupp_supplier_denormalized");
  });

  it("should display all checkboxes unchecked by default", () => {
    cy.contains("nation_region_denormalized");
    cy.contains("denormalized_data");
    cy.contains("customer_orders_lineitem_denormalized");
    cy.contains("part_partsupp_supplier_denormalized");
  });

  it("should have a Go button", () => {
    cy.get("button").contains("Go");
  });

  it("should render normalize page when clicking on Go button", () => {
    cy.contains("customer_orders_lineitem_denormalized").click();
    cy.contains("part_partsupp_supplier_denormalized").click();
    cy.contains("Go", { timeout: 60000 }).click();
    cy.url().should("contain", "/edit-schema");
  });
});
