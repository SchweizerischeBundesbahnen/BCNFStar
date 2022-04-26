import { isIIndexFileEntry } from "../../../server/definitions/IIndexFileEntry.guard";
import { isIFunctionalDependency } from "../../../server/definitions/IFunctionalDependency.guard";
import { IIndexFileEntry } from "../../../server/definitions/IIndexFileEntry";

const algorithm = "de.metanome.algorithms.hyfd_extended.HyFDExtended";
const config = { memory: "1G" };

describe("The metanomeResults route", () => {
  beforeEach(() => {
    cy.request("post", Cypress.env("BACKEND_BASEURL") + "/metanomeResults", {
      schemaAndTables: ["public.nation_region_denormalized"],
      algoClass: algorithm,
      config,
    })
      .its("body")
      .its("fileName")
      .as("fileName");
  });

  afterEach(() => {
    cy.get("@fileName").then((_fileName) => {
      const fileName = _fileName as unknown as string;
      cy.request({
        method: "get",
        url: Cypress.env("BACKEND_BASEURL") + "/metanomeResults/" + fileName,
        failOnStatusCode: false,
      });
    });
  });

  it("runs metanome", () => {
    // metanome was already run in beforeEach, so just check if it had a result
    expect(cy.get("@fileName")).to.be.not.empty;
  });
  it("returns metanome index file entries", () => {
    cy.request(
      "get",
      Cypress.env("BACKEND_BASEURL") + "/metanomeResults"
    ).should((result) => {
      expect(result.body).to.be.an("array");
      for (const entry of result.body)
        expect(
          isIIndexFileEntry(entry),
          `expected the following to be an IIndexFile: ${JSON.stringify(entry)}`
        ).to.be.true;
    });
  });
  it("contains the newly created entry", () => {
    cy.get("@fileName").then((_fileName) => {
      const fileName = _fileName as unknown as string;
      cy.request(
        "get",
        Cypress.env("BACKEND_BASEURL") + "/metanomeResults"
      ).should((result) => {
        const entries: Array<IIndexFileEntry> = result.body;
        entries.some(
          (entry) =>
            entry.fileName === fileName &&
            entry.algorithm == algorithm &&
            entry.config == config
        );
      });
    });
  });
  it("delivers metanome results", () => {
    cy.get("@fileName").then((_fileName) => {
      const fileName = _fileName as unknown as string;

      cy.request(
        "get",
        Cypress.env("BACKEND_BASEURL") + "/metanomeResults/" + fileName
      ).should((result) => {
        expect(result.body).to.be.an("array");
        expect(result.body.length).to.be.greaterThan(0);
        for (const entry of result.body)
          expect(
            isIFunctionalDependency(entry),
            `expected the following to be an IFunctionalDependency: ${JSON.stringify(
              entry
            )}`
          ).to.be.true;
      });
    });
  });
  it.only("can delete an entry", () => {
    cy.get("@fileName").then((_fileName) => {
      const fileName = _fileName as unknown as string;
      cy.request(
        "delete",
        Cypress.env("BACKEND_BASEURL") + "/metanomeResults/" + fileName
      ).should((result) => {
        expect(result.body.message).to.equal(
          "Sucessfully deleted metanome entry!"
        );
        // check whether file can no longer be reached
        cy.request({
          method: "get",
          url: Cypress.env("BACKEND_BASEURL") + "/metanomeResults/" + fileName,
          failOnStatusCode: false,
        }).should((result) => expect(result.status).to.equal(404));

        // check whether file is no longer in index file
        cy.request(
          "get",
          Cypress.env("BACKEND_BASEURL") + "/metanomeResults"
        ).should((indexResult) => {
          const entries: Array<IIndexFileEntry> = indexResult.body;
          entries.every((entry) => entry.fileName !== fileName);
        });
      });
    });
  });
});
