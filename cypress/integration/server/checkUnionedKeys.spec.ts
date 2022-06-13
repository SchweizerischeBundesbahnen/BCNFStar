describe("The /unionedkeys route", () => {
  const route: string = Cypress.env("BACKEND_BASEURL") + "/unionedkeys";

  it("returns JSON", () => {
    cy.fixture("unionedKeysBody.json").then((body) => {
      cy.request("post", route, body)
        .its("headers")
        .its("content-type")
        .should("include", "application/json");
    });
  });

  it("returns 'allowed' correctly", () => {
    cy.fixture("unionedKeysBody.json").then((body) => {
      cy.request("post", route, body).should((result) => {
        expect(result.body).equal("allowed");
      });
    });
  });

  it("returns 'allowed' correctly 2", () => {
    cy.fixture("unionedKeysBody.json").then((body) => {
      body.key1 = body.key2;
      body.unionedColumns[0] = body.unionedColumns[1];
      cy.request("post", route, body).should((result) => {
        expect(result.body).equal("allowed");
      });
    });
  });

  it("returns 'forbidden' correctly", () => {
    cy.fixture("unionedKeysBody.json").then((body) => {
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
  });

  it("returns 'forbidden' on null-columns", () => {
    cy.fixture("unionedKeysBody.json").then((body) => {
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
});
