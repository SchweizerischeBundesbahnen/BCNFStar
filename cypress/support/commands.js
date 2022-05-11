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
  cy.get("sbb-expansion-panel").then(($el) => {
    if (!$el.hasClass("sbb-expanded")) {
      cy.contains("public").click();
    }
  });

  cy.contains("nation_region_denormalized").click();
  cy.contains("part_partsupp_supplier_denormalized").click();

  cy.contains("Go").click();
});

Cypress.Commands.add(
  "selectTablesAndGo",
  { prevSubject: false },
  (tablenames) => {
    // expand expandable if it isn't expanded yet
    cy.get("sbb-expansion-panel").then(($el) => {
      if (!$el.hasClass("sbb-expanded")) {
        cy.contains("public").click();
      }
    });
    for (const table of tablenames) {
      cy.contains(table).click();
    }
    cy.contains("Go").click();
  }
);

Cypress.Commands.add("loadMetanomeConfigAndOk", { prevSubject: false }, () => {
  cy.contains("Ok").click();

  // wait for normalize page to load
  cy.url({ timeout: 2 * 60 * 1000 }).should("contain", "edit-schema");
});
