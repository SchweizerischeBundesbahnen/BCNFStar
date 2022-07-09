/// <reference types="cypress" />

describe("The integration start page", () => {
  beforeEach(() => {
    cy.visit(Cypress.env("FRONTEND_BASEURL") + "/#/integration");

    cy.selectTablesAndGo();
    cy.contains("Ok").click();
    cy.get(".sbb-dialog-container").should("not.exist");
    cy.contains("public").click();
    cy.contains("denormalized_data").click();
    cy.contains("Go").click();

    cy.contains("Use no Metanome result").click();
    cy.contains("Use no Metanome result").click();
    cy.contains("Ok").click();
    cy.contains("Start integration").click();

    // cy.loadMetanomeConfigAndOk();
    // cy.get(".table-head-title")
    //   .contains("public.nation_region_denormalized")
    //   // because we have multiple UI layers with CSS, Cypress may think the element is obstructed
    //   // while it isn't
    //   .click({ force: true });
  });
  it("renders both table editing pages", () => {
    cy.get(".table-head-title")
      .contains("public.nation_region_denormalized")
      .click();
    cy.get(".table-head-title").should(
      "not.contain.text",
      "public.denormalized_data"
    );

    cy.contains("Edit right schema").click();
    cy.get(".table-head-title").contains("public.denormalized_data").click();
    cy.get(".table-head-title").should(
      "not.contain.text",
      "public.nation_region_denormalized"
    );
  });

  it("shows correspondences in the compare window", () => {
    cy.contains("Compare schemas and integrate").click();
    cy.get(".joint-link").should("have.length", 26);
    cy.get(".table-head-title").contains("public.denormalized_data");
    cy.get(".table-head-title").contains("public.nation_region_denormalized");
  });
});