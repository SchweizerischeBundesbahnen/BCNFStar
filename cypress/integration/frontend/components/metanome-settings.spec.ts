/// <reference types="cypress" />

describe("The metanome settings dialog", () => {
  beforeEach(() => {
    cy.visitFrontend();
    cy.selectTablesAndGo();
  });

  it("renders", () => {
    cy.contains("Metanome configuration settings");
  });

  it.only("displays headings Functional Dependencies and Inclusion Dependencies", () => {
    cy.contains("Functional Dependencies");
    cy.contains("Inclusion Dependencies");
  });

  it.only("displays all headings of tabbars", () => {
    cy.contains("public.nation_region_denormalized");
    cy.contains("public.part_partsupp_supplier_denormalized");
    cy.contains(
      "public.nation_region_denormalized, public.part_partsupp_supplier_denormalized"
    );
  });

  it("displays all tabbars", () => {
    cy.get("sbb-toggle").should("have.length", 3);
    cy.get("sbb-toggle-option").should("have.length", 7);
    cy.get('sbb-toggle-option:contains("Use existing result")').should(
      "have.length",
      3
    );
    cy.get('sbb-toggle-option:contains("HyFD")').should("have.length", 2);
    cy.get('sbb-toggle-option:contains("Binder")').should("have.length", 1);
    cy.get('sbb-toggle-option:contains("FAIDA")').should("have.length", 1);
  });

  it("displays default configuration parameters", () => {
    // all HyFD and Binder parameters
    cy.get('[class="sbb-toggle-option-button-label"]:contains("HyFD")').should(
      "have.length",
      2
    );
    cy.get('[class="sbb-toggle-option-button-label"]:contains("HyFD")')
      .first()
      .click();
    cy.get('[class="sbb-toggle-option-button-label"]:contains("HyFD")')
      .last()
      .click();
    cy.contains("Binder").click();

    cy.get('sbb-checkbox:contains("ENABLE_MEMORY_GUARDIAN")').should(
      "have.length",
      2
    );
    cy.get('sbb-label:contains("INPUT_ROW_LIMIT")').should("have.length", 3);
    cy.get('sbb-label:contains("MAX_DETERMINANT_SIZE")').should(
      "have.length",
      2
    );
    cy.get('sbb-checkbox:contains("NULL_EQUALS_NULL")').should(
      "have.length",
      2
    );
    cy.get('sbb-checkbox:contains("VALIDATE_PARALLEL")').should(
      "have.length",
      2
    );
    cy.get('sbb-label:contains("memory")').should("have.length", 3);
    cy.get('sbb-checkbox:contains("CLEAN_TEMP")').should("have.length", 1);
    cy.get('sbb-checkbox:contains("DETECT_NARY")').should("have.length", 1);
    cy.get('sbb-checkbox:contains("FILTER_KEY_FOREIGNKEYS")').should(
      "have.length",
      1
    );
    cy.get('sbb-label:contains("MAX_MEMORY_USAGE_PERCENTAGE")').should(
      "have.length",
      1
    );
    cy.get('sbb-label:contains("MAX_NARY_LEVEL")').should("have.length", 1);
    cy.get('sbb-label:contains("MEMORY_CHECK_FREQUENCY")').should(
      "have.length",
      1
    );
    cy.get('sbb-label:contains("NUM_BUCKETS_PER_COLUMN")').should(
      "have.length",
      1
    );
    cy.get('sbb-label:contains("TEMP_FOLDER_PATH")').should("have.length", 1);
  });

  it("displays configuration parameters after selecting on faida", () => {
    // all HyFD and FAIDA parameters
    cy.get('[class="sbb-toggle-option-button-label"]:contains("HyFD")').should(
      "have.length",
      2
    );
    cy.get('[class="sbb-toggle-option-button-label"]:contains("HyFD")')
      .first()
      .click();
    cy.get('[class="sbb-toggle-option-button-label"]:contains("HyFD")')
      .last()
      .click();
    cy.contains("FAIDA").click();

    cy.get('sbb-checkbox:contains("ENABLE_MEMORY_GUARDIAN")').should(
      "have.length",
      2
    );
    cy.get('sbb-label:contains("INPUT_ROW_LIMIT")').should("have.length", 2);
    cy.get('sbb-label:contains("MAX_DETERMINANT_SIZE")').should(
      "have.length",
      2
    );
    cy.get('sbb-checkbox:contains("NULL_EQUALS_NULL")').should(
      "have.length",
      2
    );
    cy.get('sbb-checkbox:contains("VALIDATE_PARALLEL")').should(
      "have.length",
      2
    );
    cy.get('sbb-label:contains("memory")').should("have.length", 3);
    cy.get('sbb-label:contains("APPROXIMATE_TESTER")').should("have.length", 2);
    cy.get('sbb-label:contains("APPROXIMATE_TESTER_BYTES")').should(
      "have.length",
      1
    );
    cy.get('sbb-checkbox:contains("DETECT_NARY")').should("have.length", 1);
    cy.get('sbb-label:contains("HLL_REL_STD_DEV")').should("have.length", 1);
    cy.get('sbb-checkbox:contains("IGNORE_CONSTANT")').should("have.length", 1);
    cy.get('sbb-checkbox:contains("IGNORE_NULL")').should("have.length", 1);
    cy.get('sbb-checkbox:contains("REUSE_COLUMN_STORE")').should(
      "have.length",
      1
    );
    cy.get('sbb-label:contains("SAMPLE_GOAL")').should("have.length", 1);
    cy.get('sbb-checkbox:contains("VIRTUAL_COLUMN_STORE")').should(
      "have.length",
      1
    );
  });

  it("renders schema editing page", () => {
    cy.loadMetanomeConfigAndOk();
  });
});
