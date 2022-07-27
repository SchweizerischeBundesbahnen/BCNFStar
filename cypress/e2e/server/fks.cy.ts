import { isIForeignKey } from "../../../server/definitions/IForeignKey.guard";

describe("The /fks route", () => {
  it("returns JSON", () => {
    cy.request("get", Cypress.env("BACKEND_BASEURL") + "/fks")
      .its("headers")
      .its("content-type")
      .should("include", "application/json");
  });

  it("returns foreign keys", () => {
    cy.request("get", Cypress.env("BACKEND_BASEURL") + "/fks").should(
      (result) => {
        expect(result.body).to.be.an("array");
        for (const fk of result.body)
          expect(
            isIForeignKey(fk),
            `expected the following to be an iForeignKey: ${JSON.stringify(fk)}`
          ).to.be.true;
      }
    );
  });
});
