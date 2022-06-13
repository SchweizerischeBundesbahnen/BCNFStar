// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
import "cypress-file-upload";

Cypress.Commands.add("visitFrontend", { prevSubject: false }, (options) => {
  let finalOptions;
  if (options && options.headers) {
    finalOptions = options;
    options.headers["Accept-Encoding"] = "gzip, deflat, br";
  } else
    finalOptions = Object.assign({}, options, {
      headers: {
        "Accept-Encoding": "gzip, deflate, br",
      },
    });
  return cy.visit(Cypress.env("FRONTEND_BASEURL"), finalOptions);
});

Cypress.Commands.add("selectTablesAndGo", { prevSubject: false }, () => {
  // expand expandable if it isn't expanded yet
  cy.selectSpecificTablesAndGo("public", [
    "nation_region_denormalized",
    "part_partsupp_supplier_denormalized",
  ]);
});

Cypress.Commands.add(
  "selectSpecificTablesAndGo",
  { prevSubject: false },
  (schemaname, tablenames) => {
    // expand expandable if it isn't expanded yet
    cy.get("sbb-expansion-panel").then(($el) => {
      if (!$el.hasClass("sbb-expanded")) {
        cy.contains(schemaname).click();
      }
    });
    for (const table of tablenames) {
      cy.get(".sbb-expansion-panel-body:visible").contains(table).click();
    }
    cy.contains("Go").click();
  }
);

Cypress.Commands.add("loadMetanomeConfigAndOk", { prevSubject: false }, () => {
  cy.contains("Ok").click();

  // wait for normalize page to load
  cy.url({ timeout: 2 * 60 * 1000 }).should("contain", "edit-schema");
});

Cypress.Commands.add(
  "visitContainedSubtableTab",
  { prevSubject: false },
  () => {
    cy.contains("Subtables").click({ force: true });
  }
);

Cypress.Commands.add(
  "visitPossibleForeignKeysTab",
  { prevSubject: false },
  () => {
    cy.contains("Foreign Keys").click({ force: true });
  }
);
Cypress.Commands.add("executeSql", (Sql) => {
  return cy.task("dbQuery", { query: Sql });
});

Cypress.Commands.add("createSchema", (schemaName) => {
  cy.get("#schema-name-input").type(schemaName);
  cy.get("button").contains("Download").click();
  cy.readFile(`./cypress/downloads/${schemaName}.sql`).then((SQL) =>
    cy.executeSql(SQL)
  );
});

Cypress.Commands.add("deleteAllMetanomeResults", () => {
  cy.visit(Cypress.env("FRONTEND_BASEURL") + "/#/metanome-results");
  cy.get("table").then((table) => {
    if (table.find("tr").length > 1) {
      cy.get(".delete-all-btn").click();
      cy.get("sbb-simple-notification").contains("Deleted all entries");
    }
  });
  cy.reload();
});
