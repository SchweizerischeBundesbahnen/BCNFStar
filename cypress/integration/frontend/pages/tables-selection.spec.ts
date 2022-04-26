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

  it("renders the schema editing page when clicking on the Go button", () => {
    cy.selectTablesAndGo();
  });
});
