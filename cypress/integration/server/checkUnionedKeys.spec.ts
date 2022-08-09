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
      (body.tableSql =
        "SELECT n_nationkey, n_name FROM public.nation_region_denormalized UNION SELECT n_nationkey, n_name FROM public.nation_region_denormalized"),
        cy.request("post", route, body).should((result) => {
          expect(result.body).equal("allowed");
        });
    });
  });

  it("returns 'forbidden' correctly", () => {
    cy.fixture("unionedKeysBody.json").then((body) => {
      (body.tableSql =
        "SELECT n_nationkey, n_regionkey, r_comment FROM public.nation_region_denormalized UNION SELECT n_regionkey, n_nationkey, r_comment FROM public.nation_region_denormalized"),
        (body.expectedKey.attributes = ["n_nationkey"]);

      body.expectedKey = {
        table_schema: "public",
        table_name: "nation_region_denormalized",
        attributes: ["n_nationkey"],
      };

      cy.request("post", route, body).should((result) => {
        expect(result.body).equal("forbidden");
      });
    });
  });

  it("returns 'forbidden' on null-columns", () => {
    cy.fixture("unionedKeysBody.json").then((body) => {
      (body.tableSql =
        "SELECT n_nationkey, n_regionkey, r_comment FROM public.nation_region_denormalized UNION SELECT null, n_nationkey, r_comment FROM public.nation_region_denormalized"),
        (body.expectedKey.attributes = ["n_nationkey"]);

      cy.request("post", route, body).should((result) => {
        expect(result.body).equal("forbidden");
      });
    });
  });

  it("returns error on empty sql", () => {
    cy.fixture("unionedKeysBody.json").then((body) => {
      body.table1Sql = "";
      body.unionedColumns = [
        ["n_nationkey", "n_regionkey", "r_comment"],
        ["null", "n_nationkey", "r_comment"],
      ];
      cy.request({
        method: "post",
        url: route,
        body: body,
        failOnStatusCode: false,
      });
    });
  });
});
