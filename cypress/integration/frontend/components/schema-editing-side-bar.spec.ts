/// <reference types="cypress" />

describe("The schema editing side bar", () => {
  beforeEach(() => {
    cy.visitFrontend();

    cy.selectTablesAndGo();

    cy.loadMetanomeConfigAndOk();

    cy.clickOnTable("public.nation_region_denormalized");
  });

  // ############# Show elements #############
  it("renders", () => {
    cy.get("app-schema-editing-side-bar");
  });

  it("displays the 'auto normalize this table' button", () => {
    cy.visitContainedSubtableTab();
    cy.get("button").contains("Auto-normalize this table");
  });

  it("displays the table name", () => {
    cy.get("h1").contains("public.nation_region_denormalized");
  });

  it("displays Functional Dependencies", () => {
    cy.visitContainedSubtableTab();
    cy.get("sbb-expansion-panel-header")
      // commas that exist on page between these columns are just css
      .contains("n_regionkey r_comment r_name r_regionkey")
      .click({ force: true });
    cy.get(".sbb-expansion-panel-body button").contains("r_regionkey");
    cy.get(".sbb-expansion-panel-body button").contains("r_comment");
    cy.get(".sbb-expansion-panel-body button").contains("r_name");
    cy.get(".sbb-expansion-panel-body button").contains("n_regionkey");
  });

  // ############# Rename table in split dialog #############
  it("sets default name when splitting by fd", () => {
    cy.visitContainedSubtableTab();

    cy.get("sbb-expansion-panel-header")
      .contains("n_regionkey r_comment r_name r_regionkey")
      .click({ force: true });
    cy.get(".sbb-expansion-panel-body button").contains("r_regionkey").click();
    cy.get("button").contains("Ok").click();
    cy.contains("r_regionkey");
  });

  it("sets new name when splitting by fd and change table name", () => {
    cy.visitContainedSubtableTab();

    cy.get("sbb-expansion-panel-header")
      .contains("n_regionkey r_comment r_name r_regionkey")
      .click({ force: true });
    cy.get(".sbb-expansion-panel-body button").contains("r_regionkey").click();
    cy.get('app-split-dialog [type="text"]').clear().type("Regions");
    cy.get("button").contains("Ok").click();
    cy.contains("Regions");
  });
});
