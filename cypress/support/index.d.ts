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
  }
}
