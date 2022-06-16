describe("The /typecasting route", () => {
  const route: string = Cypress.env("BACKEND_BASEURL") + "/typecasting";

  it("returns JSON", () => {
    cy.fixture("typeCastingBody.json").then((body) => {
      cy.request("post", route, body)
        .its("headers")
        .its("content-type")
        .should("include", "application/json");
    });
  });

  it("returns 'allowed' correctly", () => {
    cy.fixture("typeCastingBody.json").then((body) => {
      cy.request("post", route, body).should((result) => {
        expect(result.body).equal("allowed");
      });
    });
  });

  it("returns 'informationloss' correctly", () => {
    cy.fixture("typeCastingBody.json").then((body) => {
      body.targetDatatype = "character varying (1)";
      cy.request("post", route, body).should((result) => {
        expect(result.body).equal("informationloss");
      });
    });
  });

  it("returns 'forbidden' correctly", () => {
    cy.fixture("typeCastingBody.json").then((body) => {
      body.targetDatatype = "datetime";
      cy.request("post", route, body).should((result) => {
        expect(result.body).equal("forbidden");
      });
    });
  });

  it("returns 'allowed' on null-column", () => {
    cy.fixture("typeCastingBody.json").then((body) => {
      body.column = "null";
      body.targetDatatype = "integer";
      cy.log(JSON.stringify(body));
      cy.request("post", route, body).should((result) => {
        expect(result.body).equal("allowed");
      });
    });
  });

  it("fails on invalid datatype", () => {
    cy.fixture("typeCastingBody.json").then((body) => {
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
});
