import { IRequestBodyTypeCasting } from "./../../../server/definitions/TypeCasting";

describe("The /typecasting route", () => {
  const route: string = Cypress.env("BACKEND_BASEURL") + "/typecasting";
  const body: IRequestBodyTypeCasting = {
    schema: "public",
    table: "nation_region_denormalized",
    column: "n_nationkey",
    currentDatatype: "integer",
    targetDatatype: "integer",
  };

  it("returns JSON", () => {
    cy.request("post", route, body)
      .its("headers")
      .its("content-type")
      .should("include", "application/json");
  });

  it("returns 'allowed' correctly", () => {
    cy.request("post", route, body).should((result) => {
      expect(result.body).equal("allowed");
    });
  });

  it("returns 'informationloss' correctly", () => {
    body.targetDatatype = "character varying (1)";
    cy.request("post", route, body).should((result) => {
      expect(result.body).equal("informationloss");
    });
  });

  it("returns 'forbidden' correctly", () => {
    body.targetDatatype = "datetime";
    cy.request("post", route, body).should((result) => {
      expect(result.body).equal("forbidden");
    });
  });

  it("fails on invalid datatype", () => {
    body.targetDatatype = "xxxxx";
    body.currentDatatype = "xxxxx";
    cy.request({
      method: "post",
      url: route,
      body,
      failOnStatusCode: false,
    }).should((result) => {
      expect(result.status).to.eq(422);
    });
  });
});
