/// <reference types="cypress" />

describe("The keys tab", () => {
  beforeEach(() => {
    cy.visitFrontend();

    cy.selectTablesAndGo();

    cy.loadMetanomeConfigAndOk();
    cy.clickOnTable("public.nation_region_denormalized");
  });

  it("displays keys", () => {
    cy.get("sbb-expansion-panel")
      .should("contain.text", "Keys")
      .and("contain.text", "n_nationkey")
      .and("contain.text", "n_comment")
      .and("contain.text", "n_name");
  });

  it("displays surrogate keys", () => {
    addFkAndSurrkey();
    cy.get(".pk").contains("surrkey");
    cy.get("app-graph-element").contains("surrkey_s_nationkey");
  });

  it("allows to delete surrogate keys", () => {
    addFkAndSurrkey();
    cy.get("#delete-surrkey-btn").click();
    cy.get(".pk").should("not.contain.text", "surrkey");
    cy.get("app-graph-element").should(
      "not.contain.text",
      "surrkey_s_nationkey"
    );
  });

  it("allows to rename surrogate keys", () => {
    addFkAndSurrkey();
    cy.get("#edit-surrkey-btn").click();
    cy.get("#surrogate-key-input").clear().type("renamed");

    cy.contains("Save surrogate key").click();

    cy.get(".pk")
      .should("contain.text", "renamed")
      .and("not.contain.text", "surrkey");
    cy.get("app-graph-element")
      .should("contain.text", "renamed_s_nationkey")
      .and("not.contain.text", "surrkey_s_nationkey");
  });
});

function addFkAndSurrkey() {
  cy.clickOnTable("public.part_partsupp_supplier");

  cy.visitPossibleForeignKeysTab();
  cy.contains(
    "(public.part_partsupp_supplier_denormalized) s_nationkey -> (public.nation_region_denormalized) n_nationkey"
  ).click();
  cy.contains("Create Foreign Key").click();

  cy.clickOnTable("public.nation_region_denormalized");

  cy.get(".sbb-tab-label-content").first().click({ force: true });
  cy.get("#surrogate-key-input").type("surrkey");
  cy.contains("Save surrogate key").click();
}
