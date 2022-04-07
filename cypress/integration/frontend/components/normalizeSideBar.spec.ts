/// <reference types="cypress" />

describe("The normalize side bar", () => {
  beforeEach(() => {
    cy.visitFrontend();

    cy.contains("public").click();

    cy.contains("nation_region_denormalized").click();
    // cy.contains("denormalized_data").click();
    // cy.contains("customer_orders_lineitem_denormalized").click();
    cy.contains("part_partsupp_supplier_denormalized").click();

    cy.contains("Go").click();

    cy.get(".table-head-title", {
      timeout: 10 * 60 * 1000,
    })
      .contains("public.nation_region_denormalized")
      .click({ force: true });
  });

  // ############# Show elements #############
  it("renders", () => {
    cy.get("app-normalize-side-bar");
  });

  it("displays the 'auto normalize this table' button", () => {
    cy.get("button").contains("Auto-normalize this table");
  });

  it("displays the table name", () => {
    cy.get("h2").contains("public.nation_region_denormalized");
  });

  it("displays keys", () => {
    cy.get("sbb-expansion-panel").contains("Keys");
    cy.get("sbb-expansion-panel").contains("n_name");
    cy.get("sbb-expansion-panel").contains("n_nationkey");
    cy.get("sbb-expansion-panel").contains("n_comment");
  });

  it("displays Functional Dependencies", () => {
    cy.get("sbb-expansion-panel").contains("Contained Subtables");
    cy.get("sbb-expansion-panel-header")
      .contains("n_regionkey, r_regionkey, r_name, r_comment")
      .click();
    cy.get(".sbb-expansion-panel-body button").contains("r_regionkey");
    cy.get(".sbb-expansion-panel-body button").contains("r_comment");
    cy.get(".sbb-expansion-panel-body button").contains("r_name");
    cy.get(".sbb-expansion-panel-body button").contains("n_regionkey");
  });

  it("does not display invalid Inclusion Dependencies", () => {
    cy.get("sbb-expansion-panel").contains("Possible Foreign Keys");
    cy.contains(
      "r_regionkey->(public.customer_orders_lineitem_denormalized) c_nationkey"
    ).should("not.exist");
    cy.contains(
      "n_regionkey->(public.customer_orders_lineitem_denormalized) c_nationkey"
    ).should("not.exist");
  });

  it("displays valid Inclusion Dependencies", { scrollBehavior: false }, () => {
    // force means: don't fail if other elements are over the element to be clicked
    // the graph element can be below the schema graph, so we need it here
    // this has no consequences for the user
    cy.get(".table-head-title")
      .contains("public.part_partsupp")
      .click({ force: true });
    cy.contains("s_nationkey->(public.nation_region_denormalized) n_nationkey");
  });

  it("displays the joining button", () => {
    cy.get("button").contains("Create Foreign Key");
  });

  // ############# Rename table in sidebar #############
  it("changes table name when editing it", () => {
    cy.get('[svgIcon="kom:pen-small"]').click();
    cy.get("#rename-table-input").clear().type("Nations{enter}");
    cy.get("h2").contains("Nations");
    cy.get(".table-head-title").contains("Nations");
  });

  it("leaves editing mode and not renames table when something changes", () => {
    cy.get('[svgIcon="kom:pen-small"]').click();
    cy.get(".table-head-title").contains("part_partsupp").click();
    cy.get("h2").contains("part_partsupp");
  });

  // ############# Rename table in split dialog #############
  it("sets default name when splitting by fd", () => {
    cy.get("sbb-expansion-panel-header")
      .contains("n_regionkey, r_regionkey, r_name, r_comment")
      .click();
    cy.get(".sbb-expansion-panel-body button").contains("r_regionkey").click();
    cy.get("button").contains("Ok").click();
    cy.contains("r_regionkey");
  });

  it("sets new name when splitting by fd and change table name", () => {
    cy.get("sbb-expansion-panel-header")
      .contains("n_regionkey, r_regionkey, r_name, r_comment")
      .click();
    cy.get(".sbb-expansion-panel-body button").contains("r_regionkey").click();
    cy.get('app-split-dialog [type="text"]').clear().type("Regions");
    cy.get("button").contains("Ok").click();
    cy.contains("Regions");
  });
});
