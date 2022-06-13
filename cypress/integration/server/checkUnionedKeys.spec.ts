import { IRequestBodyUnionedKeys } from "./../../../server/definitions/IUnionedKeys";

describe("The /unionedkeys route", () => {
  const route: string = Cypress.env("BACKEND_BASEURL") + "/unionedkeys";
  const body: IRequestBodyUnionedKeys = {
    key1: {
      table_schema: "public",
      table_name: "nation_region_denormalized",
      attributes: ["n_nationkey", "n_name"],
    },
    key2: {
      table_schema: "public",
      table_name: "nation_region_denormalized",
      attributes: ["n_nationkey", "r_name"],
    },
    unionedColumns: [
      ["n_nationkey", "n_name"],
      ["n_nationkey", "r_name"],
    ],
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

  it("returns 'allowed' correctly 2", () => {
    body.key1 = body.key2;
    body.unionedColumns[0] = body.unionedColumns[1];
    cy.request("post", route, body).should((result) => {
      expect(result.body).equal("allowed");
    });
  });

  it("returns 'forbidden' correctly", () => {
    body.key1.attributes = ["n_nationkey"];
    body.key2.attributes = ["n_regionkey"];

    body.unionedColumns = [
      ["n_nationkey", "n_regionkey", "r_comment"],
      ["n_regionkey", "n_nationkey", "r_comment"],
    ];
    cy.request("post", route, body).should((result) => {
      expect(result.body).equal("forbidden");
    });
  });

  it("returns 'forbidden' on null-columns", () => {
    body.key1.attributes = ["n_nationkey"];
    body.key2.attributes = ["null"];

    body.unionedColumns = [
      ["n_nationkey", "n_regionkey", "r_comment"],
      ["null", "n_nationkey", "r_comment"],
    ];
    cy.request("post", route, body).should((result) => {
      expect(result.body).equal("forbidden");
    });
  });
});
