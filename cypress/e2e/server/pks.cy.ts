import { isIPrimaryKey } from "../../../server/definitions/IPrimaryKey.guard";

describe("The /pks route", () => {
  it("returns JSON", () => {
    cy.request("get", Cypress.env("BACKEND_BASEURL") + "/pks")
      .its("headers")
      .its("content-type")
      .should("include", "application/json");
  });

  it("returns primary keys", () => {
    cy.request("get", Cypress.env("BACKEND_BASEURL") + "/pks").should(
      (result) => {
        expect(result.body).to.be.an("array");
        for (const pk of result.body)
          expect(
            isIPrimaryKey(pk),
            `expected the following to be an IPrimaryKey: ${JSON.stringify(pk)}`
          ).to.be.true;
      }
    );
  });
});
