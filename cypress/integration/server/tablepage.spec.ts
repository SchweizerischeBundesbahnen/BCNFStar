import ITable from "../../../server/definitions/ITable";
import ITablePage from "../../../server/definitions/ITablePage";
import { isITablePage } from "../../../server/definitions/ITablePage.guard";

describe("The /tables/page route", () => {
  // see https://www.cypress.io/blog/2017/11/07/add-gui-to-your-e2e-api-tests/
  it("returns JSON", () => {
    // 'get' can be ommitted as it is the default
    cy.request(
      "get",
      Cypress.env("BACKEND_BASEURL") +
        "/tables/page?schema=public&table=nation_region_denormalized&offset=0&limit=100"
    )
      .its("headers")
      .its("content-type")
      .should("include", "application/json");
  });

  it("returns an ITablePage object", () => {
    cy.request(
      "get",
      Cypress.env("BACKEND_BASEURL") +
        `/tables/page?schema=public&table=nation_region_denormalized&offset=0&limit=100`
    ).should((result) => {
      expect(
        isITablePage(result.body),
        `expected the following to be an iTablePage: ${JSON.stringify(
          result.body
        )}`
      ).to.be.true;
    });
  });

  it("returns the specified number of rows", () => {
    const rownumber: number = 10;
    cy.request(
      "get",
      Cypress.env("BACKEND_BASEURL") +
        `/tables/page?schema=public&table=nation_region_denormalized&offset=0&limit=${rownumber}`
    ).should((result) => {
      const res: ITablePage = result.body as ITablePage;
      expect(res.rows.length == rownumber);
    });
  });

  it("returns different rows if offset is set", () => {
    cy.request(
      "get",
      Cypress.env("BACKEND_BASEURL") +
        `/tables/page?schema=public&table=nation_region_denormalized&offset=0&limit=1`
    ).should((result) => {
      cy.request(
        "get",
        Cypress.env("BACKEND_BASEURL") +
          `/tables/page?schema=public&table=nation_region_denormalized&offset=1&limit=1`
      ).should((result2) => {
        const res: ITablePage = result.body as ITablePage;
        const res2: ITablePage = result2.body as ITablePage;
        expect(res.rows[0] != res2.rows[0]);
      });
    });
  });

  it("needs limit parameter", () => {
    cy.request({
      method: "get",
      url:
        Cypress.env("BACKEND_BASEURL") +
        `/tables/page?schema=public&table=nation_region_denormalized&offset=0`,
      failOnStatusCode: false,
    }).should((result) => expect(result.status).to.eq(400));
  });
});
