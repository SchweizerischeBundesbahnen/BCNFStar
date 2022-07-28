import { isITable } from "../../../server/definitions/ITable.guard";

describe("The /tables route", () => {
  // see https://www.cypress.io/blog/2017/11/07/add-gui-to-your-e2e-api-tests/
  it("returns JSON", () => {
    // 'get' can be ommitted as it is the default
    cy.request("get", Cypress.env("BACKEND_BASEURL") + "/tables")
      .its("headers")
      .its("content-type")
      .should("include", "application/json");
  });

  it("returns tables", () => {
    cy.request("get", Cypress.env("BACKEND_BASEURL") + "/tables").should(
      (result) => {
        // reference for assertions: https://docs.cypress.io/guides/references/assertions#BDD-Assertions

        expect(result.body).to.be.an("array");
        for (const table of result.body)
          expect(
            isITable(table),
            `expected the following to be an iTable: ${JSON.stringify(table)}`
          ).to.be.true;
      }
    );
  });
});
