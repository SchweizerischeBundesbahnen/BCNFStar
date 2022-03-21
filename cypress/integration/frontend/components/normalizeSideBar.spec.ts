/// <reference types="cypress" />

describe("The normalize side bar", () => {
  beforeEach(() => {
    cy.visitFrontend();

    cy.contains("public").click();

    cy.contains("nation_region_denormalized").click();
    // cy.contains("denormalized_data").click();
    cy.contains("customer_orders_lineitem_denormalized").click();
    // cy.contains("part_partsupp_supplier_denormalized").click();

    cy.contains("Go").click();

    cy.contains("public.nation_region_denormalized", {
      timeout: 60000,
    }).click();
  });
  it("should be rendered", () => {
    cy.get("app-normalize-side-bar");
  });

  it("should display auto normalize this table button", () => {
    cy.get("button").contains("Auto-normalize this table");
  });

  it("should display table name", () => {
    cy.contains("nation_region_denormalized");
  });

  it("should display keys", () => {
    cy.get("sbb-expansion-panel").contains("Keys");
    cy.get("sbb-expansion-panel").contains("_name");
    cy.get("sbb-expansion-panel").contains("n_nationkey");
    cy.get("sbb-expansion-panel").contains("n_comment");
  });

  it("should display Functional Dependencies", () => {
    cy.get("sbb-expansion-panel").contains("Functional Dependencies");
    cy.get("sbb-expansion-panel").contains(
      "r_regionkey -> r_name, r_comment, n_regionkey"
    );
    cy.get("sbb-expansion-panel").contains(
      "r_comment -> r_regionkey, r_name, n_regionkey"
    );
    cy.get("sbb-expansion-panel").contains(
      "r_name -> r_regionkey, r_comment, n_regionkey"
    );
    cy.get("sbb-expansion-panel").contains(
      "n_regionkey -> r_regionkey, r_name, r_comment"
    );
  });

  it("should display Inclusion Dependencies", () => {
    cy.get("sbb-expansion-panel").contains("Inclusion Dependencies");
    cy.get("sbb-expansion-panel").contains(
      "r_regionkey->(public.customer_orders_lineitem_denormalized) c_nationkey"
    );
    cy.get("sbb-expansion-panel").contains(
      "n_regionkey->(public.customer_orders_lineitem_denormalized) c_nationkey"
    );
  });

  it("should display splitting button", () => {
    cy.get("button").contains("Split Functional Dependency");
  });

  it("should display joining button", () => {
    cy.get("button").contains("Create Foreign Key");
  });
});
