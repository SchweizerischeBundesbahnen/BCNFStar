import { isIForeignKey } from "../../../server/definitions/IForeignKey.guard";

describe("The /samples route", () => {
  it("returns JSON", () => {
    cy.request(
      "get",
      Cypress.env("BACKEND_BASEURL") +
        "/samples?tableName=public.nation_region_denormalized&=&columnName=n_name"
    )
      .its("headers")
      .its("content-type")
      .should("include", "application/json");
  });

  it("returns column sample", () => {
    cy.request(
      "get",
      Cypress.env("BACKEND_BASEURL") +
        "/samples?tableName=public.nation_region_denormalized&=&columnName=n_name"
    ).should((result) => {
      expect(result.body.length).to.be.equals(25);
    });
  });
});
