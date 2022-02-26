/// <reference types="cypress" />

describe("The app", () => {
  beforeEach(() => {
    cy.visitFrontend();
  });

  it("should be render title", () => {
    cy.title().should("eq", "BCNFStar");
  });

  it("should be render heading", () => {
    cy.get("h1").contains("BCNFStar");
  });
});
