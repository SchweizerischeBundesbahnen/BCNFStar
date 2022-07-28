/// <reference types="cypress" />

describe("The schema editing page", () => {
  beforeEach(() => {
    cy.visitFrontend();
    cy.selectTablesAndGo();
    cy.loadMetanomeConfigAndOk();
  });

  it("renders", () => {
    cy.url().should("contain", "/edit-schema");
  });

  it("displays the undo/redo buttons", () => {
    cy.get("button#undo");
    cy.get("button#redo");
  });

  it("displays the reset view button", () => {
    cy.get("button").contains("Reset view");
  });

  it("displays the 'auto normalize all tables' button", () => {
    cy.get("button").contains("Auto-normalize all tables");
  });

  it("has the schema graph", () => {
    cy.get("app-schema-graph");
  });

  it("displays existing primary keys", () => {
    cy.get('[data-cy="graph-element-columns"][class="ellipsis pk"]').should(
      "have.length",
      3
    );
    cy.get('[data-cy="graph-element-columns"][class="ellipsis pk"]').should(
      "contain",
      "ps_partkey"
    );
    cy.get('[data-cy="graph-element-columns"][class="ellipsis pk"]').should(
      "contain",
      "ps_suppkey"
    );
    cy.get('[data-cy="graph-element-columns"][class="ellipsis pk"]').should(
      "contain",
      "ps_supplycost"
    );
    it("shows nullable information for columns", () => {
      cy.get('[data-cy="graph-element-column-datatype"]').should(
        "contain",
        "(integer, not null)"
      );
      cy.get('[data-cy="graph-element-column-datatype"]').should(
        "contain",
        "(varchar(25), null)"
      );
    });

    it("renders all tables", () => {
      cy.get("app-graph-element").should("have.length", 2);
      cy.get("app-graph-element").should(
        "contain",
        "nation_region_denormalized"
      );
      cy.get("app-graph-element").should(
        "contain",
        "part_partsupp_supplier_denormalized"
      );
    });
  });
});
