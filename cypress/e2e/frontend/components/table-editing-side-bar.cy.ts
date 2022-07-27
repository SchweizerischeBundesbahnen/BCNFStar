/// <reference types="cypress" />

describe("The table editing side bar", () => {
  beforeEach(() => {
    cy.visitFrontend();

    cy.selectTablesAndGo();

    cy.loadMetanomeConfigAndOk();

    cy.clickOnTable("public.nation_region_denormalized");

    cy.get(".sbb-tab-label-content").contains("Table Editing").click();
  });

  // ############# Rename table in sidebar #############
  it("changes table name when editing it", () => {
    cy.get("#table-edit-icon").click();
    cy.get("#rename-table-input").clear().type("Nations{enter}");
    cy.get("#table-name").contains("Nations");
    cy.get(".table-head-title").contains("Nations");
  });

  it("leaves editing mode and not renames table when something changes", () => {
    cy.get("#table-edit-icon").click();
    cy.clickOnTable("part_partsupp");
    cy.get("h2").contains("part_partsupp");
  });
});
