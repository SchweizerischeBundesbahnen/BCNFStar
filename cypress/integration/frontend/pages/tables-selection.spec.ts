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

  it("display loading dialog after clicking in Ok Button of Metanome Settings", () => {
    cy.selectTablesAndGo();
    cy.get('[class="sbb-toggle-option-button-label"]:contains("HyFD")').should(
      "have.length",
      2
    );
    cy.get('[class="sbb-toggle-option-button-label"]:contains("HyFD")')
      .first()
      .click();
    cy.get('[class="sbb-toggle-option-button-label"]:contains("HyFD")')
      .last()
      .click();
    cy.contains("Binder").click();
    cy.contains("Ok").click();

    cy.get('[class="sbb-dialog-title ng-star-inserted"]').contains(
      "Running Metanome"
    );
    cy.get(
      '[class="sbb-dialog-content sbb-scrollbar ng-star-inserted"]'
    ).contains(
      "Functional Dependencies and Inclusion Dependencies are currently being searched."
    );
    cy.get(
      '[class="sbb-dialog-content sbb-scrollbar ng-star-inserted"]'
    ).contains("Progress can be monitored here");
    cy.get(
      '[class="sbb-dialog-content sbb-scrollbar ng-star-inserted"]'
    ).contains(
      "de.metanome.algorithms.hyfd_extended.HyFDExtended with public.part_partsupp_supplier_denormalized"
    );
    cy.get(
      '[class="sbb-dialog-content sbb-scrollbar ng-star-inserted"]'
    ).contains(
      "de.metanome.algorithms.hyfd_extended.HyFDExtended with public.nation_region_denormalized"
    );
    cy.get(
      '[class="sbb-dialog-content sbb-scrollbar ng-star-inserted"]'
    ).contains(
      "de.metanome.algorithms.binder.BINDERFile with public.part_partsupp_supplier_denormalized,public.nation_region_denormalized"
    );
  });

  it("renders the schema editing page after  clicking on the Go and Ok button", () => {
    cy.selectTablesAndGo();
    cy.loadMetanomeConfigAndOk();
  });
});
