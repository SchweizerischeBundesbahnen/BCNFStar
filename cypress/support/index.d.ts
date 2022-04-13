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
     * Selects which tables to use for schema editing, and enters schema editing mode
     * The following tables are being selected:
     * - nation_region_denormalized
     * - part_partsupp_supplier_denormalized
     *
     * Note: make sure to always test on the data provided in the sql files in the cypress folder
     */
    selectTablesAndGo(): Chainable<Element>;
  }
}
