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

  it("renders the schema editing page when clicking on the Go button", () => {
    cy.selectTablesAndGo();
  });
});
