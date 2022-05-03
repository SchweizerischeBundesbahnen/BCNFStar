/// <reference types="cypress" />

describe("The metanome results page", () => {
  before(() => {
    cy.visitFrontend();
    cy.selectTablesAndGo();
  });

  beforeEach(() => {
    cy.visit(Cypress.env("FRONTEND_BASEURL") + "/#/metanome-results");
  });

  it("renders", () => {
    cy.get("h1").contains("Metanome results");
    cy.get("table").contains("File name");
  });

  it("contains metanome result rows", () => {
    cy.get("tr").should("have.length.at.least", 3);
    cy.contains("de.metanome.algorithms.normalize.Normi");
    cy.contains("de.metanome.algorithms.binder.BINDERFile");
    cy.contains("public.part_partsupp_supplier_denormalized");
  });

  it("sort metanome results descending by creation date", () => {
    cy.get(".creation-date").then((dateObjects) => {
      let dates = Cypress._.map(dateObjects, (date) =>
        new Date(date.innerHTML).getTime()
      );
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i] >= dates[i + 1]).to.be.true;
      }
    });
  });

  it("delete metanome results", () => {
    cy.contains("de.metanome.algorithms.normalize.Normi");
    cy.get("tr")
      .its("length")
      .then((length) => {
        cy.get(".delete-btn").first().click();
        cy.get("body").should(
          "not.contain",
          "An error ocurred while trying to delete this metanome result"
        );
        cy.reload();
        cy.visit(Cypress.env("FRONTEND_BASEURL") + "/#/metanome-results");
        cy.get("tr").should("have.length", length - 1);
      });
  });
});
