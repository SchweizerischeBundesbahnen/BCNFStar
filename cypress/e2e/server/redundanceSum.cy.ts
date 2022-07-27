import { isIForeignKey } from "../../../server/definitions/IForeignKey.guard";

describe("The /redundances route", () => {
  it("returns JSON", () => {
    cy.request(
      "get",
      Cypress.env("BACKEND_BASEURL") +
        "/redundances?tableName=SELECT%20DISTINCT%20%22nation_region_denormalized%22.%22n_nationkey%22,%20%22nation_region_denormalized%22.%22n_name%22,%20%22nation_region_denormalized%22.%22n_regionkey%22,%20%22nation_region_denormalized%22.%22n_comment%22,%20%22nation_region_denormalized%22.%22r_regionkey%22,%20%22nation_region_denormalized%22.%22r_name%22,%20%22nation_region_denormalized%22.%22r_comment%22%20FROM%20%22public%22.%22nation_region_denormalized%22&&fdColumns=[%22n_regionkey%22]"
    )
      .its("headers")
      .its("content-type")
      .should("include", "application/json");
  });

  it("returns redundance sum", () => {
    cy.request(
      "get",
      Cypress.env("BACKEND_BASEURL") +
        "/redundances?tableName=SELECT%20DISTINCT%20%22nation_region_denormalized%22.%22n_nationkey%22,%20%22nation_region_denormalized%22.%22n_name%22,%20%22nation_region_denormalized%22.%22n_regionkey%22,%20%22nation_region_denormalized%22.%22n_comment%22,%20%22nation_region_denormalized%22.%22r_regionkey%22,%20%22nation_region_denormalized%22.%22r_name%22,%20%22nation_region_denormalized%22.%22r_comment%22%20FROM%20%22public%22.%22nation_region_denormalized%22&&fdColumns=[%22n_regionkey%22]"
    ).should((result) => {
      expect(result.body).to.be.equals(25);
    });
  });
});
