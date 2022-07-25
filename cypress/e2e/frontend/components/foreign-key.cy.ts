/// <reference types="cypress" />

describe("The foreign keys tab", () => {
  beforeEach(() => {
    cy.visitFrontend();
    cy.selectTablesAndGo();
    cy.loadMetanomeConfigAndOk();

    cy.clickOnTable("public.nation_region_denormalized");

    cy.visitPossibleForeignKeysTab();
  });

  it("displays valid Inclusion Dependencies", { scrollBehavior: false }, () => {
    cy.clickOnTable("public.part_partsupp");
    cy.contains(
      "(public.part_partsupp_supplier_denormalized) s_nationkey -> (public.nation_region_denormalized) n_nationkey"
    );
  });

  it("displays the joining button", () => {
    cy.get("button").contains("Create Foreign Key");
  });

  it("creates one fk", () => {
    cy.createForeignKey();
  });

  it("hides created fk and displays it unter Dismissed Foreign Keys", () => {
    cy.createForeignKey();
    cy.get('[joint-selector="delete-fk-button"]').click();
    cy.contains(
      "(public.part_partsupp_supplier_denormalized) s_nationkey -> (public.nation_region_denormalized) n_nationkey"
    );
    cy.get("#add-hidden-fk-button").should("exist");
  });

  it("displays foreign key after hide it", () => {
    cy.createForeignKey();
    cy.get('[joint-selector="delete-fk-button"]').click();
    cy.contains(
      "(public.part_partsupp_supplier_denormalized) s_nationkey -> (public.nation_region_denormalized) n_nationkey"
    );
    cy.get("#add-hidden-fk-button").click();
    cy.get('[joint-selector="delete-fk-button"]').should("exist");
  });
});
