/// <reference types="cypress" />

describe("The persist-button should create executable SQL", () => {
  const normalizedSchema = "test_schema_normalized";
  const denormalizedSchema = "test_schema_denormalized";
  const surrogateKeysSchema = "test_schema_surrogate_keys";
  const normalizedTables = ["nation_region_denormalized", "n_regionkey"];

  let columns: Array<string> = [];

  it("creates executable SQL", () => {
    cy.visitFrontend();
    cy.selectSpecificTablesAndGo("public", ["nation_region_denormalized"]);

    cy.loadMetanomeConfigAndOk();
    cy.get('[data-cy="graph-element-columns"]')
      .invoke("text")
      .then((text) => columns.push(...text.trim().split(/[ ,]+/)));

    cy.get("button").contains("Auto-normalize all tables").click();

    cy.createSchema(normalizedSchema);
  });

  it("creates tables", () => {
    cy.visitFrontend();
    cy.contains(normalizedSchema);
    cy.selectSpecificTablesAndGo(normalizedSchema, normalizedTables);
    cy.loadMetanomeConfigAndOk();
  });

  it("creates keys", () => {
    cy.get('[data-cy="graph-element-columns"].pk]').should(
      "have.length",
      1
    );
    cy.get('[data-cy="graph-element-columns"].pk').should(
      "contain",
      "n_regionkey"
    );
    cy.get(".joint-tool").should("have.length", 2);
  });

  it("denormalized table contains same data as initial table", () => {
    cy.get('[joint-selector="join-button"]').click({ force: true });
    cy.contains("Ok").click();

    cy.createSchema(denormalizedSchema);

    const Sql = `SELECT COUNT(*) FROM (SELECT ${columns.join(
      ","
    )} FROM public.nation_region_denormalized EXCEPT SELECT ${columns.join(
      ","
    )} FROM ${denormalizedSchema}.nation_region_denormalized) AS x`;

    cy.executeSql(Sql).then((response) =>
      expect(response.rows[0].count).to.equal("0")
    );
  });

  it("creates surrogate keys", () => {
    cy.visitFrontend();
    cy.selectSpecificTablesAndGo(normalizedSchema, normalizedTables);
    cy.loadMetanomeConfigAndOk();
    cy.get(".table-head")
      .contains(normalizedSchema + ".n_regionkey")
      .click();
    const surrkeyName = "surrkey";
    cy.get("#surrogate-key-input").type(surrkeyName);
    cy.contains("Save surrogate key").click();
    cy.createSchema(surrogateKeysSchema);

    const queryWithoutSurrkey = `
    SELECT n.n_nationkey, r.n_regionkey FROM
      ${normalizedSchema}.nation_region_denormalized n 
        JOIN ${normalizedSchema}.n_regionkey r
        ON n.n_regionkey = r.n_regionkey
      ORDER BY n.n_nationkey, r.n_regionkey;`;
    const queryWithSurrkey = `
    SELECT n.n_nationkey, r.n_regionkey FROM
      ${surrogateKeysSchema}.nation_region_denormalized n 
        JOIN ${surrogateKeysSchema}.n_regionkey r
        ON n.${surrkeyName}_n_regionkey = r.${surrkeyName}
      ORDER BY n.n_nationkey, r.n_regionkey;`;

    cy.executeSql(queryWithoutSurrkey).then((resultWithout) => {
      cy.executeSql(queryWithSurrkey).then((resultWith) => {
        expect(resultWithout.rows).to.deep.equal(resultWith.rows);
      });
    });
  });

  // TODO maybe we should think about transactions?
  after("database cleanup", () => {
    cy.executeSql(`DROP SCHEMA IF EXISTS ${normalizedSchema} CASCADE`);
    cy.executeSql(`DROP SCHEMA IF EXISTS ${denormalizedSchema} CASCADE`);
    cy.executeSql(`DROP SCHEMA IF EXISTS ${surrogateKeysSchema} CASCADE`);
  });
});
