/// <reference types="cypress" />

describe("The save schema editing", () => {
  beforeEach(() => {
    cy.visitFrontend();
    cy.selectTablesAndGo();
    cy.loadMetanomeConfigAndOk();
  });

  it("renders the save current schema state button", () => {
    cy.contains("Save current schema state");
  });

  it("renders filename input", () => {
    cy.get("input")
      .eq(3)
      .invoke("attr", "placeholder")
      .should("contain", "file name");
  });

  it("disables the save current schema state button when filename input is empty", () => {
    cy.contains("Save current schema state").should("be.disabled");
  });

  it("saves schema", () => {
    cy.get("input").eq(3).type("savedSchema");
    cy.contains("Save current schema state").click();
    cy.get("sbb-simple-notification").contains("Schema download");
    cy.readFile("cypress/downloads/savedSchema.zip").should("exist");
  });
});
