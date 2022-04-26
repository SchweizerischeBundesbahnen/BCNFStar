import { hyfdAlgorithmName } from "../../../../server/definitions/IHyFD";
import { binderAlgorithmName } from "../../../../server/definitions/IBinder";
/// <reference types="cypress" />

describe("The metanoem results page", () => {
  before(() => {
    cy.visitFrontend();
    cy.contains("public").click();
    cy.contains("nation_region_denormalized").click();
    // cy.contains("denormalized_data").click();
    // cy.contains("customer_orders_lineitem_denormalized").click();
    cy.contains("part_partsupp_supplier_denormalized").click();
    cy.contains("Go").click();
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
    cy.contains(hyfdAlgorithmName);
    cy.contains(binderAlgorithmName);
    cy.contains("public.part_partsupp_supplier_denormalized");
  });

  it("delete metanome results", () => {
    cy.contains(hyfdAlgorithmName);
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
