/// <reference types="cypress" />

describe("The normalize side bar", () => {
  beforeEach(() => {
    cy.visitFrontend();

    cy.contains("Default Connection").click();

    cy.contains("public.nation_region_denormalized").click();
    cy.contains("public.denormalized_data").click();
    cy.contains("public.customer_orders_lineitem_denormalized").click();
    cy.contains("public.part_partsupp_supplier_denormalized").click();

    cy.contains("Go").click();

    cy.get("span").contains("public.nation_region_denormalized").click();
  });
  it("should be rendered", () => {
    cy.get("app-normalize-side-bar");
  });

  it("should display auto normalize this table button", () => {
    cy.get("button").contains("Auto-normalize this table");
  });

  it("should display table name", () => {
    cy.contains("public.nation_region_denormalized");
  });

  it("should display keys", () => {
    cy.get("sbb-expansion-panel")
      .contains("Keys")
      .should("contain", "n_name")
      .should("contain", "n_nationkey")
      .should("contain", "n_comment");
  });

  it("should display Functional Dependencies", () => {
    cy.get("sbb-expansion-panel")
      .contains("Functional Dependencies")
      .contains("r_regionkey -> n_regionkey, r_name, r_comment")
      .contains("r_comment -> n_regionkey, r_regionkey, r_name")
      .contains("r_name -> n_regionkey, r_regionkey, r_comment")
      .contains("n_regionkey -> r_regionkey, r_name, r_comment");
  });

  it("should display Inclusion Dependencies", () => {
    cy.get("sbb-expansion-panel")
      .contains("Inclusion Dependencies")
      .contains(
        "n_regionkey->(public.customer_orders_lineitem_denormalized) c_nationkey"
      )
      .contains(
        "r_regionkey->(public.customer_orders_lineitem_denormalized) c_nationkey"
      )
      .contains("r_comment->(public.denormalized_data) r_comment")
      .contains("r_name->(public.denormalized_data) r_name")
      .contains("n_regionkey->(public.denormalized_data) c_nationkey")
      .contains("n_regionkey->(public.denormalized_data) n_nationkey")
      .contains("n_regionkey->(public.denormalized_data) n_regionkey")
      .contains("n_regionkey->(public.denormalized_data) r_regionkey")
      .contains("r_regionkey->(public.denormalized_data) c_nationkey");
  });

  it("should display splitting button", () => {
    cy.get("button").contains("Split Functional Dependency");
  });

  it("should display joining button", () => {
    cy.get("button").contains("Join Inclusion Dependency");
  });
});
