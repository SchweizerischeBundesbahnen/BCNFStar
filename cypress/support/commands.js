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

Cypress.Commands.add("visitForeignKeyTab", { prevSubject: false }, () => {
  cy.contains("Foreign Keys").click({ force: true });
});

Cypress.Commands.add(
  "visitSuggestForeignKeyTab",
  { prevSubject: false },
  () => {
    cy.visitForeignKeyTab();

    cy.get(".sbb-expansion-panel-header")
      .contains("Suggest Foreign Key")
      .then(($ele) => {
        cy.log($ele.parent().attr("aria-expanded") == "false");
        if ($ele.parent().attr("aria-expanded") == "false") {
          cy.get(".sbb-expansion-panel-header")
            .contains("Suggest Foreign Key")
            .click({ force: true });
        }
      });
  }
);

Cypress.Commands.add(
  "visitCheckContainedSubtableTab",
  { prevSubject: false },
  () => {
    cy.visitContainedSubtableTab();
    cy.get(".sbb-expansion-panel-header")
      .contains("Check Contained Subtable")
      .then(($ele) => {
        cy.log($ele.parent().attr("aria-expanded") == "false");
        if ($ele.parent().attr("aria-expanded") == "false") {
          cy.get(".sbb-expansion-panel-header")
            .contains("Check Contained Subtable")
            .click({ force: true });
        }
      });
  }
);

Cypress.Commands.add(
  "joinTablesByFirstIND",
  { prevSubject: false },
  (table1, table2) => {
    cy.createForeignKeyByFirstIND(table1, table2);
    cy.get(".joint-tool").click();
    cy.get(".sbb-button").contains("Ok").click();
  }
);

Cypress.Commands.add("checkFD", { prevSubject: false }, (lhs, rhs) => {
  cy.get("#lhsSelection").click();
  cy.selectColumns(lhs);

  cy.get("#rhsSelection").click();
  cy.selectColumns(rhs);

  cy.get("button").contains("Check Functional Dependency").click();
});

Cypress.Commands.add(
  "checkIND",
  { prevSubject: false },
  (referencedTable, columnMapping) => {
    cy.get("#referencedTableSelection").click();
    cy.get(".sbb-option").contains(referencedTable).click({ force: true });

    if (columnMapping.length > 0) {
      for (const columnTupel of columnMapping) {
        cy.get(".sbb-select-placeholder").first().click({ force: true });
        cy.selectColumns([columnTupel[0]], false);

        cy.get(".sbb-select-placeholder").last().click({ force: true });
        cy.selectColumns([columnTupel[1]], false);

        cy.get("#columnRelationButton").last().click();
      }
      cy.get("#checkIndButton").click();
    }
  }
);

Cypress.Commands.add(
  "selectColumns",
  { prevSubject: false },
  (columnList, multiselection = true) => {
    cy.log(columnList.toString());
    for (const column of columnList) {
      cy.get(".sbb-option").contains(column).click({ force: true });
    }
    if (multiselection) cy.get(".cdk-overlay-backdrop-showing").click();
  }
);

Cypress.Commands.add(
  "createForeignKeyByFirstIND",
  { prevSubject: false },
  (table1, table2) => {
    cy.clickOnTable(table1);
    cy.visitPossibleForeignKeysTab();
    cy.get("#possibleForeignKeysSelection").first().click();
    cy.get(".sbb-checkbox").click();
    cy.get(".sbb-option").contains(table2).click();
    cy.get(".cdk-overlay-backdrop").click();
    cy.get(".sbb-radio-button").first().click();
    cy.get(".sbb-button").contains("Create Foreign Key").click();
  }
);

Cypress.Commands.add(
  "visitPossibleForeignKeysTab",
  { prevSubject: false },
  () => {
    cy.contains("Foreign Keys").click({ force: true });

    cy.get(".sbb-expansion-panel-header")
      .contains("Possible Foreign Keys")
      .then(($ele) => {
        cy.log($ele.parent().attr("aria-expanded") == "false");
        if ($ele.parent().attr("aria-expanded") == "false") {
          cy.get(".sbb-expansion-panel-header")
            .contains("Possible Foreign Keys")
            .click({ force: true });
        }
      });
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

Cypress.Commands.add("clickOnTable", (tablename) => {
  cy.get(`.table-head-title:contains("${tablename}")`).click({ force: true });
});
Cypress.Commands.add("createForeignKey", () => {
  cy.visitPossibleForeignKeysTab();
  cy.contains("public.part_partsupp_supplier_denormalized").click();
  cy.get("sbb-radio-button")
    .contains(
      "(public.part_partsupp_supplier_denormalized) s_nationkey -> (public.nation_region_denormalized) n_nationkey"
    )
    .click();
  cy.get("button").contains("Create Foreign Key").click();
});
