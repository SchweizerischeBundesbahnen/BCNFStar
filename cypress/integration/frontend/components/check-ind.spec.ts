/// <reference types="cypress" />

describe("The check-ind component should display violating rows for custom inds", () => {
  beforeEach(() => {
    cy.visitFrontend();
    cy.selectSpecificTablesAndGo("public", [
      "nation_region_denormalized",
      "part_partsupp_supplier_denormalized",
    ]);
    cy.loadMetanomeConfigAndOk();
    cy.clickOnTable("public.nation_region_denormalized");
    cy.visitSuggestForeignKeyTab();
  });

  it("does not enable check IND-Button, if no columns are selected", () => {
    cy.checkIND("public.part_partsupp_supplier_denormalized", []);
    cy.get("#checkIndButton").should("be.disabled");
  });

  it("opens violating rows dialog for invalid ind", () => {
    cy.checkIND("public.part_partsupp_supplier_denormalized", [
      ["n_nationkey", "ps_partkey"],
      ["n_name", "ps_suppkey"],
    ]);
    cy.contains("Violating Rows for suggested Foreign Key");
  });

  it("doesn't open dialog for valid ind", () => {
    cy.checkIND("nation_region_denormalized", [["n_regionkey", "n_nationkey"]]);

    cy.contains("Violating Rows for suggested Foreign Key").should("not.exist");
    cy.contains("The suggested IND is valid");
  });

  it("allows fd check on multi-tables", () => {
    cy.joinTablesByFirstIND(
      "public.part_partsupp_supplier_denormalized",
      "public.nation_region_denormalized"
    );

    cy.visitSuggestForeignKeyTab();

    cy.checkIND("public.part_partsupp_supplier_denormalized", [
      ["r_regionkey", "ps_partkey"],
      ["n_regionkey", "p_partkey"],
    ]);
  });

  it("matching all columns with itself results in valid ind", () => {
    cy.checkIND(
      "nation_region_denormalized",
      [
        "n_nationkey",
        "n_name",
        "n_regionkey",
        "n_comment",
        "r_regionkey",
        "r_name",
        "r_comment",
      ].map((column) => [column, column])
    );
    cy.contains("The suggested IND is valid");
  });
});
