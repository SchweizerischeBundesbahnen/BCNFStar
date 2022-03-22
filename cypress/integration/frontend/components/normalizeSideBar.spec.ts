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
  it("renders", () => {
    cy.get("app-normalize-side-bar");
  });

  it("displays the 'auto normalize this table' button", () => {
    cy.get("button").contains("Auto-normalize this table");
  });

  it("displays the table name", () => {
    cy.contains("nation_region_denormalized");
  });

  it("displays keys", () => {
    cy.get("sbb-expansion-panel").contains("Keys");
    cy.get("sbb-expansion-panel").contains("_name");
    cy.get("sbb-expansion-panel").contains("n_nationkey");
    cy.get("sbb-expansion-panel").contains("n_comment");
  });

  it("displays Functional Dependencies", () => {
    cy.get("sbb-expansion-panel").contains("Functional Dependencies");
    cy.get("sbb-expansion-panel").contains(
      "r_regionkey -> n_regionkey, r_name, r_comment"
    );
    cy.get("sbb-expansion-panel").contains(
      "r_comment -> n_regionkey, r_regionkey, r_name"
    );
    cy.get("sbb-expansion-panel").contains(
      "r_name -> n_regionkey, r_regionkey, r_comment"
    );
    cy.get("sbb-expansion-panel").contains(
      "n_regionkey -> r_regionkey, r_name, r_comment"
    );
  });

  it("displays Inclusion Dependencies", () => {
    cy.get("sbb-expansion-panel").contains("Inclusion Dependencies");
    cy.get("sbb-expansion-panel").contains(
      "r_regionkey->(public.customer_orders_lineitem_denormalized) c_nationkey"
    );
    cy.get("sbb-expansion-panel").contains(
      "n_regionkey->(public.customer_orders_lineitem_denormalized) c_nationkey"
    );
  });

  it("displays the splitting button", () => {
    cy.get("button").contains("Split Functional Dependency");
  });

  it("displays the joining button", () => {
    cy.get("button").contains("Create Foreign Key");
  });
});
