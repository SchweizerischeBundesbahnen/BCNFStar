/// <reference types="cypress" />

describe("The tables page", () => {
  beforeEach(() => {
    cy.visitFrontend();
  });
  it("should be able to navigate to the normalize page", () => {
    // contains asserts that a element with the content exists and selects it
    cy.contains("public.nation_region_denormalized").click();
    cy.contains("Go").click();
    cy.url().should("contain", "/edit-schema");
  });
});
