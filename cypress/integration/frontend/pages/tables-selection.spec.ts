import { exampleSchemaToJSON } from "../../../utils/exampleTables";
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

  it("display content of numeric columns right", () => {
    cy.contains("nation_region_denormalized").trigger("mouseenter");
    cy.get("td:contains('6')").should("have.class", "numeric");
  });

  it("display content of not numeric columns left", () => {
    cy.contains("nation_region_denormalized").trigger("mouseenter");
    cy.get("td:contains('FRANCE')").should("not.have.class", "numeric");
  });

  it("shows table row count", () => {
    cy.contains("customer_orders_lineitem_denormalized").trigger("mouseenter");
    cy.contains("1 - 20 / 6005");
    cy.get("sbb-paginator").contains("301").click();
    cy.contains("6001 - 6005 / 6005");
    cy.get('button[aria-label="Previous Page"]').click();
    cy.contains("5981 - 6000 / 6005");
  });

  it("shows table content", () => {
    cy.contains("part_partsupp_supplier_denormalized").trigger("mouseenter");
    // first is ps_partkey, second ps_suppkey
    cy.get(".sbb-row")
      .first()
      .should("contain.text", "154")
      .and("contain.text", "5");

    cy.get('button[aria-label="Next Page"]').click();

    cy.get(".sbb-row")
      .first()
      .should("contain.text", "58")
      .should("contain.text", "6");
  });

  it("display loading dialog after clicking in Ok Button of Metanome Settings", () => {
    cy.selectTablesAndGo();
    cy.get('[class="sbb-toggle-option-button-label"]:contains("HyFD")').should(
      "have.length",
      2
    );
    cy.get('[class="sbb-toggle-option-button-label"]:contains("HyFD")').click({
      multiple: true,
    });
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
    ).contains("Fetching results");
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
      "de.metanome.algorithms.binder.BINDERFile with public.nation_region_denormalized,public.part_partsupp_supplier_denormalized"
    );
  });

  it("renders the schema editing page after clicking on the Go and Ok button", () => {
    cy.selectTablesAndGo();
    cy.loadMetanomeConfigAndOk();
  });

  it("loads, saves and loads edited schema correct", () => {
    cy.get("sbb-expansion-panel:contains('Load saved schema')").click();
    cy.contains("Upload file").click();
    cy.get('input[type="file"]').attachFile("savedExampleSchema.zip");
    cy.get(".sbb-button").eq(0).should("contain", "Load").click();
    cy.url({ timeout: 2 * 60 * 1000 }).should("contain", "edit-schema");
    cy.get("input").eq(3).type("savedExampleSchema");
    cy.contains("Save current schema state").click();
    cy.get("sbb-simple-notification").contains("Schema download");
    cy.readFile("cypress/downloads/savedExampleSchema.zip").then((result) => {
      expect(result == cy.fixture("savedExampleSchema.zip"));
    });
  });
});
