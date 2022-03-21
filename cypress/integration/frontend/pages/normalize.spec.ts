/// <reference types="cypress" />

describe("The normalize page", () => {
  beforeEach(() => {
    cy.visitFrontend();

    cy.contains("public").click();

    cy.contains("nation_region_denormalized").click();
    // cy.contains("denormalized_data").click();
    // cy.contains("customer_orders_lineitem_denormalized").click();
    cy.contains("part_partsupp_supplier_denormalized").click();

    cy.contains("Go").click();
    cy.wait(2000);
  });

  it("should be rendered", () => {
    cy.url().should("contain", "/edit-schema");
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
    cy.get("app-graph-element").should("have.length", 2);
    cy.get("app-graph-element").should("contain", "nation_region_denormalized");
    // cy.get("app-graph-element").should("contain", "denormalized_data");
    // cy.get("app-graph-element").should(
    //   "contain",
    //   "customer_orders_lineitem_denormalized"
    // );
    cy.get("app-graph-element").should(
      "contain",
      "part_partsupp_supplier_denormalized"
    );
  });
});
