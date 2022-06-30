describe("The parameter validation for the sql, which is for example implemented in /violatingRows/fd route", () => {
  const url = Cypress.env("BACKEND_BASEURL") + "/violatingRows/fd";
  const body = {
    sql: "",
    lhs: [],
    rhs: [],
    offset: 0,
    limit: 0,
  };

  it("returns status code 422, if sql is invalid", () => {
    body.sql = "INVALID SQL";
    cy.request({
      method: "post",
      url: url,
      body,
      failOnStatusCode: false,
    }).should((result) => {
      expect(result.status).to.eq(422);
    });
  });

  it("returns invalid if SQL contains comments", () => {
    body.sql = "--";
    cy.request({
      method: "post",
      url: url,
      body,
      failOnStatusCode: false,
    }).should((result) => {
      expect(result.status).to.eq(422);
    });
  });

  it("returns invalid if SQL is empty", () => {
    body.sql = "";
    cy.request({
      method: "post",
      url: url,
      body,
      failOnStatusCode: false,
    }).should((result) => {
      expect(result.status).to.eq(422);
    });
  });

  it("returns invalid if SQL contains reserved keywords like DROP", () => {
    body.sql = "DROP";
    cy.request({
      method: "post",
      url: url,
      body,
      failOnStatusCode: false,
    }).should((result) => {
      expect(result.status).to.eq(422);
    });
  });

  it("returns invalid if SQL contains reserved keyword exec", () => {
    body.sql = "exec";
    cy.request({
      method: "post",
      url: url,
      body,
      failOnStatusCode: false,
    }).should((result) => {
      expect(result.status).to.eq(422);
    });
  });
});
