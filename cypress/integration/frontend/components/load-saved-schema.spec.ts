import { exampleSchemaToJSON } from "../../../utils/exampleTables";
/// <reference types="cypress" />

describe("The load saved schema editing", () => {
  beforeEach(() => {
    cy.visitFrontend();
    cy.get("sbb-expansion-panel:contains('Load saved schema')").click();
  });

  it("renders the upload file button", () => {
    cy.contains("Upload file");
  });

  it("renders the load button", () => {
    cy.get(".sbb-button").eq(0).should("contain", "Load");
  });

  it("renders schema after selecting a file and click the load button", () => {
    cy.contains("Upload file").click();
    cy.fixture("savedSchema.zip").then((fileContent) => {
      cy.get('input[type="file"]').attachFile({
        fileContent: fileContent.toString(),
        fileName: "savedSchema.zip",
        mimeType: "application/zip",
      });
    });
    cy.get(".sbb-button").eq(0).click();
    cy.url({ timeout: 2 * 60 * 1000 }).should("contain", "edit-schema");
  });
});
