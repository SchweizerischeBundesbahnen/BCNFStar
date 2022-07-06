/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    //  Hier können die Typen für eigene commands aus commands.ts wie unten gezeigt definiert werden
    /**
     * Custom command to select DOM element by data-cy attribute.
     * @example cy.dataCy('greeting')
     */
    dataCy(value: string): Chainable<Element>;

    /**
     * Visits the BCNFStar frontend page
     * Takes regular cy.visit options, but overrides the header's Accept Encoding setting
     * to allow gzipped requests
     */
    visitFrontend(options?: Partial<Cypress.VisitOptions>): Chainable<Element>;

    /**
     * Selects which tables to use for schema editing, and enters metanome configuration settings dialog
     * The following tables are being selected:
     * - nation_region_denormalized
     * - part_partsupp_supplier_denormalized
     *
     * Note: make sure to always test on the data provided in the sql files in the cypress folder
     */
    selectTablesAndGo(): void;

    /**
     * Gets to edit-schema page with specified schema and tables. Must have called visitFrontend before.
     */
    selectSpecificTablesAndGo(schema: string, tables: string[]): void;

    /**
     * Executes the given query on the test database.
     */
    executeSql(query: string): any;

    /** Downloads the schema result, and executes it. Must be on schema-edit page to work */
    createSchema(name: string): void;

    /**
     * Selects if existing metanome configuration files or new configurations are used, and enters schema editing mode
     * Selects always the default configruations files.
     *
     * Note: make sure to always test on the data provided in the sql files in the cypress folder
     */
    loadMetanomeConfigAndOk(): void;

    /**
     * Goes to the metanome results page and presses delete all if there is at least one entry. Waits for success message
     */
    deleteAllMetanomeResults(): void;

    visitContainedSubtableTab(): void;

    visitPossibleForeignKeysTab(): void;

    visitCheckContainedSubtableTab(): void;

    checkFD(lhs: Array<string>, rhs: Array<string>);

    visitSuggestForeignKeyTab(): void;

    checkIND(referencedTable: string, columnRelationship: Array<Array<string>>);

    joinTablesByFirstIND(referencingTable: string, referencedTable: string);

    createForeignKey(): void;

    /**
     * Clicks on a table in the graph to reveal it's sidebar
     * @param name Part of the name of the table that uniquely identifies it. May be in form schemaname.tablename
     */
    clickOnTable(name: string): void;

    /**
     * Unions two tables starting from the schema editing page.
     * @param table1 Table to start the union from
     * @param table2 Table to be selected in the union dropdown
     * @param columnMapping an array of tuples. Each tuple contains column names of both tables that should be matched
     */
    unionTables(
      table1: string,
      table2: string,
      columnMapping: Array<[string, string]>
    );
  }
}
