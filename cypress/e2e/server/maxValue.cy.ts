import { isIForeignKey } from "../../../server/definitions/IForeignKey.guard";

describe("The /maxValue route", () => {
  it("returns JSON", () => {
    cy.request(
      "get",
      Cypress.env("BACKEND_BASEURL") +
        "/maxValue/column?tableName=nation_region_denormalized&=&columnName=n_name"
    )
      .its("headers")
      .its("content-type")
      .should("include", "application/json");
  });

  it("returns max value", () => {
    cy.request(
      "get",
      Cypress.env("BACKEND_BASEURL") +
        "/maxValue/column?tableName=nation_region_denormalized&=&columnName=n_name"
    ).should((result) => {
      expect(result.body).to.be.equals(14);
    });
  });
});
