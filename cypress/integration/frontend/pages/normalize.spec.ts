/// <reference types="cypress" />

describe("The normalize page", () => {
  beforeEach(() => {
    cy.visitFrontend();

    cy.contains("Default Connection").click();

    cy.contains("public.nation_region_denormalized").click();
    cy.contains("public.denormalized_data").click();
    cy.contains("public.customer_orders_lineitem_denormalized").click();
    cy.contains("public.part_partsupp_supplier_denormalized").click();

    cy.contains("Go").click();
  });

  it("should be rendered", () => {
    cy.url().should("contain", "/normalize");
  });

  it("should display undo/redo buttons", () => {
    cy.get("button").contains("Undo");
    cy.get("button").contains("Redo");
  });

  it("should display reset view button", () => {
    cy.get("button").contains("Reset view");
  });

  it("should display auto normalize all tables buttons", () => {
    cy.get("button").contains("Auto-normalize all tables");
  });

  it("should have normalize schema graph", () => {
    cy.get("app-normalize-schema-graph");
  });

  it("should render all tables", () => {
    cy.get("app-graph-element").should("have.length", 4);
    cy.get("app-graph-element").should(
      "contain",
      "public.nation_region_denormalized"
    );
    cy.get("app-graph-element").should("contain", "public.denormalized_data");
    cy.get("app-graph-element").should(
      "contain",
      "public.customer_orders_lineitem_denormalized"
    );
    cy.get("app-graph-element").should(
      "contain",
      "public.part_partsupp_supplier_denormalized"
    );
  });
});
