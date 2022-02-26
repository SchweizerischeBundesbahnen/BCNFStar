/// <reference types="cypress" />

describe("The table selection page", () => {
  beforeEach(() => {
    cy.visitFrontend();
    cy.contains("Default Connection").click();
  });

  it("should be rendered", () => {
    cy.url().should("contain", "/table-selection");
  });

  it("should display all tables of the database", () => {
    cy.contains("public.nation_region_denormalized");
    cy.contains("public.denormalized_data");
    cy.contains("public.customer_orders_lineitem_denormalized");
    cy.contains("public.part_partsupp_supplier_denormalized");
  });

  it("should display all checkboxes unchecked by default", () => {
    cy.contains("public.nation_region_denormalized");
    cy.contains("public.denormalized_data");
    cy.contains("public.customer_orders_lineitem_denormalized");
    cy.contains("public.part_partsupp_supplier_denormalized");
  });

  it("should have a Go button", () => {
    cy.get("button").contains("Go");
  });

  it("should render normalize page when clicking on Go button", () => {
    cy.contains("public.customer_orders_lineitem_denormalized").click();
    cy.contains("public.part_partsupp_supplier_denormalized").click();
    cy.contains("Go").click();
    cy.url().should("contain", "/normalize");
  });
});
