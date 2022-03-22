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
    cy.contains("Undo", { timeout: 60000 });
  });

  it("renders", () => {
    cy.url().should("contain", "/edit-schema");
  });

  it("displays the undo/redo buttons", () => {
    cy.get("button").contains("Undo");
    cy.get("button").contains("Redo");
  });

  it("displays the reset view button", () => {
    cy.get("button").contains("Reset view");
  });

  it("displays the 'auto normalize all tables' button", () => {
    cy.get("button").contains("Auto-normalize all tables");
  });

  it("has the normalize schema graph", () => {
    cy.get("app-normalize-schema-graph");
  });

  it("renders all tables", () => {
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