/// <reference types="cypress" />

describe("The app", () => {
  beforeEach(() => {
    cy.visitFrontend();
  });

  it("renders the title", () => {
    cy.title().should("eq", "BCNFStar");
  });

  it("renders the heading", () => {
    cy.get(".sbb-header-lean-label").contains("BCNFStar");
  });
});
