/// <reference types="cypress" />

describe("The integration start page", () => {
  beforeEach(() => {
    cy.visit(Cypress.env("FRONTEND_BASEURL") + "/#/integration");

    // cy.loadMetanomeConfigAndOk();
    // cy.get(".table-head-title")
    //   .contains("public.nation_region_denormalized")
    //   // because we have multiple UI layers with CSS, Cypress may think the element is obstructed
    //   // while it isn't
    //   .click({ force: true });
  });

  it("renders properly", () => {
    cy.contains("Left existing schema");
    cy.contains("Right existing schema");
    cy.contains("public", {}).should("have.length", 2);
    cy.get("button").contains("Go").should("have.length", 2);
    cy.get("button").contains("Start integration");
  });
});
