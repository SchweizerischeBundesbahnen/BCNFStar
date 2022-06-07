/// <reference types="cypress" />

describe("The check-fd component should display violating rows for custom fds", () => {
  beforeEach(() => {
    cy.visitFrontend();
    cy.selectSpecificTablesAndGo("public", ["nation_region_denormalized"]);
    cy.loadMetanomeConfigAndOk();
    cy.clickOnTable("public.nation_region_denormalized");
    cy.visitCheckContainedSubtableTab();
  });

  it.only("opens violating rows dialog for invalid fd", () => {
    cy.get("#lhs_selection").click();
    selectColumns(["r_comment"]);

    cy.get("#rhs_selection").click();
    selectAllColumns();

    cy.get("button").contains("Check Functional Dependency").click();
    cy.contains("Violating Rows for suggested Contained Subtable");
  });

  it("doesn't open dialog for valid fd", () => {
    cy.get("#lhs_selection").click();
    selectColumns(["n_nationkey"]);

    cy.get("#rhs_selection").click();
    selectColumns(["r_comment"]);

    cy.get("button").contains("Check Functional Dependency").click();
  });

  it("displays violating rows grouped by lhs", () => {});

  function selectAllColumns() {
    cy.get(".sbb-option").click({ multiple: true });
    cy.get(".cdk-overlay-backdrop").click();
  }

  function selectColumns(columns) {
    for (const column of columns) {
      cy.get(".sbb-option").contains(column).click();
    }
    cy.get(".cdk-overlay-backdrop").click();
  }
});
