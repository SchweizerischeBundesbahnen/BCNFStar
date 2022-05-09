import { hyfdAlgorithmName } from "../../../../server/definitions/IHyFD";
import { binderAlgorithmName } from "../../../../server/definitions/IBinder";
import { faidaAlgorithmName } from "../../../../server/definitions/IFaida";
/// <reference types="cypress" />

describe("The metanome results page", () => {
  before(() => {
    cy.visit(Cypress.env("FRONTEND_BASEURL") + "/#/metanome-results");
    cy.get("tr").should("have.length.at.least", 1);
    cy.get(".delete-all-btn").click();
    cy.visitFrontend();
    cy.selectTablesAndGo();
    cy.loadMetanomeConfigAndOk();
  });

  beforeEach(() => {
    cy.visit(Cypress.env("FRONTEND_BASEURL") + "/#/metanome-results");
    cy.get("tr").should("have.length.at.least", 1);
  });

  it("renders", () => {
    cy.get("h1").contains("Metanome results");
    cy.get("table").contains("File name");
    cy.get("table").contains("Algorithm");
    cy.get("table").contains("Tables");
    cy.get("table").contains("Config");
    cy.get("table").contains("Date");
    cy.contains("Delete All Results");
  });

  it("contains metanome result rows", () => {
    cy.get("tr").should("have.length.at.least", 3);
    cy.contains(hyfdAlgorithmName);
    cy.contains(faidaAlgorithmName);
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

  it("delete specific metanome result", () => {
    cy.contains(hyfdAlgorithmName);
    cy.get("tr")
      .its("length")
      .then((length) => {
        cy.get(".delete-btn").should("have.length", length - 1);
        cy.get(".delete-btn").first().click();
        cy.get("body").should(
          "not.contain",
          "An error ocurred while trying to delete this metanome result"
        );
        cy.get("sbb-simple-notification").contains("Deleted entry");
        cy.reload();
        cy.visit(Cypress.env("FRONTEND_BASEURL") + "/#/metanome-results");
        cy.get("tr").should("have.length", length - 1);
      });
  });

  it("delete all metanome results", () => {
    cy.get(".delete-all-btn").click();
    cy.get("body").should(
      "not.contain",
      "An error ocurred while trying to delete this metanome result"
    );
    cy.get("sbb-simple-notification").contains("Deleted entry");
    cy.reload();
    cy.get("tr").should("have.length", 1);
    cy.get(".delete-btn").should("have.length", 0);
  });
});
