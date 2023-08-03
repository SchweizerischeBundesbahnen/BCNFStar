/// <reference types="cypress" />

describe("The metanome settings dialog", () => {
  beforeEach(() => {
    cy.deleteAllMetanomeResults();
    cy.visitFrontend();
    cy.selectTablesAndGo();
  });

  after(() => {
    cy.deleteAllMetanomeResults();
  });

  it("renders", () => {
    cy.contains("Metanome configuration settings");
  });

  it("displays headings Functional Dependencies and Inclusion Dependencies", () => {
    cy.contains("Functional Dependencies");
    cy.contains("Inclusion Dependencies");
  });

  it("displays all headings of tabbars", () => {
    cy.contains("public.nation_region_denormalized");
    cy.contains("public.part_partsupp_supplier_denormalized");
    cy.contains(
      "public.nation_region_denormalized, public.part_partsupp_supplier_denormalized"
    );
  });

  it("displays all tabbars", () => {
    cy.get("sbb-toggle").should("have.length", 3);
    cy.get("sbb-toggle-option").should("have.length", 12);
    cy.get('sbb-toggle-option:contains("Use no Metanome result")').should(
      "have.length",
      3
    );
    cy.get('sbb-toggle-option:contains("Use existing result")').should(
      "have.length",
      3
    );
    cy.get('sbb-toggle-option:contains("HyFD")').should("have.length", 2);
    cy.get('sbb-toggle-option:contains("BINDER")').should("have.length", 1);
    cy.get('sbb-toggle-option:contains("FAIDA")').should("have.length", 1);
  });

  it("displays default configuration parameters", () => {
    // all HyFD and BINDER parameters
    cy.get('[class="sbb-toggle-option-button-label"]:contains("HyFD")').should(
      "have.length",
      2
    );
    cy.get('[class="sbb-toggle-option-button-label"]:contains("HyFD")')
      .first()
      .click({ multiple: true });
    cy.contains("BINDER").click();

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
    cy.get('[class="sbb-toggle-option-button-label"]:contains("HyFD")').click({
      multiple: true,
    });
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

  it("selects HyFD and BINDER tab when no results exists", () => {
    cy.visit(Cypress.env("FRONTEND_BASEURL") + "/#/metanome-results");
    cy.get(".delete-all-btn").click();
    cy.visitFrontend();
    cy.selectTablesAndGo();

    cy.get('sbb-toggle-option:contains("Use existing result")').click({
      multiple: true,
    });
    cy.get("sbb-toggle-option:contains('HyFD')").should(
      "have.class",
      "sbb-toggle-option-selected"
    );
    cy.get("sbb-toggle-option:contains('BINDER')")
      .last()
      .should("have.class", "sbb-toggle-option-selected");
  });

  it("displays the 'Apply this setting to all HyFD Configs' button", () => {
    cy.contains("Apply this config to all tables");
    cy.get("button:contains('Apply this config to all tables')").should(
      "have.length",
      2
    );
  });

  it("applies HyFD settings of one config to all other configs when clicking on 'Apply this setting to all HyFD Configs' button", () => {
    cy.get('[class="sbb-toggle-option-button-label"]:contains("HyFD")').click({
      multiple: true,
    });

    cy.get(".memory").first().clear().type("1G");
    cy.get(".MAX_DETERMINANT_SIZE").first().clear().type("4");
    cy.get(".NULL_EQUALS_NULL").first().click();

    cy.contains("Apply this config to all tables").click();

    cy.get(".memory").eq(1).should("have.value", "1G");
    cy.get(".MAX_DETERMINANT_SIZE").eq(1).should("have.value", "4");
    cy.get(".NULL_EQUALS_NULL").eq(1).should("not.be.checked");
  });

  it("does not changes all HyFD Configs after clicking on 'Apply this setting to all HyFD Configs' button", () => {
    cy.get('[class="sbb-toggle-option-button-label"]:contains("HyFD")').click({
      multiple: true,
    });

    cy.get(".INPUT_ROW_LIMIT").first().clear().type("5");
    cy.contains("Apply this config to all tables").click();
    cy.get(".INPUT_ROW_LIMIT").eq(1).should("have.value", "5");

    cy.get(".MAX_DETERMINANT_SIZE").first().clear().type("4");
    cy.get(".MAX_DETERMINANT_SIZE").eq(1).should("have.value", "-1");
  });

  it("renders schema editing page", () => {
    cy.loadMetanomeConfigAndOk();
  });

  it("uses existing result and loads schema editing page", () => {
    cy.loadMetanomeConfigAndOk();
    cy.visitFrontend();
    cy.selectTablesAndGo();
    cy.get("sbb-toggle-option:contains('Use existing result')").should(
      "have.class",
      "sbb-toggle-option-selected"
    );
    cy.contains("Ok").click();
    cy.url({ timeout: 2 * 60 * 1000 }).should("contain", "edit-schema");
  });

  it("chooses new default configuration settings (HyFD, HyFD, BINDER) and loads schema editing page", () => {
    cy.get('[class="sbb-toggle-option-button-label"]:contains("HyFD")')
      .first()
      .click({ multiple: true });
    cy.contains("BINDER").click();

    cy.contains("Ok").click();
    cy.url({ timeout: 2 * 60 * 1000 }).should("contain", "edit-schema");

    cy.visit(Cypress.env("FRONTEND_BASEURL") + "/#/metanome-results");
    cy.get("tr").should("have.length", 4);

    cy.get(
      "tr:contains('public.part_partsupp_supplier_denormalized')"
    ).contains("ENABLE_MEMORY_GUARDIAN: true");
    cy.get(
      "tr:contains('public.part_partsupp_supplier_denormalized')"
    ).contains("INPUT_ROW_LIMIT: -1");
    cy.get(
      "tr:contains('public.part_partsupp_supplier_denormalized')"
    ).contains("MAX_DETERMINANT_SIZE: -1");
    cy.get(
      "tr:contains('public.part_partsupp_supplier_denormalized')"
    ).contains("NULL_EQUALS_NULL: true");
    cy.get(
      "tr:contains('public.part_partsupp_supplier_denormalized')"
    ).contains("VALIDATE_PARALLEL: true");
    cy.get(
      "tr:contains('public.part_partsupp_supplier_denormalized')"
    ).contains("memory:");

    cy.get("tr:contains('public.nation_region_denormalized')").contains(
      "ENABLE_MEMORY_GUARDIAN: true"
    );
    cy.get("tr:contains('public.nation_region_denormalized')").contains(
      "INPUT_ROW_LIMIT: -1"
    );
    cy.get("tr:contains('public.nation_region_denormalized')").contains(
      "MAX_DETERMINANT_SIZE: -1"
    );
    cy.get("tr:contains('public.nation_region_denormalized')").contains(
      "NULL_EQUALS_NULL: true"
    );
    cy.get("tr:contains('public.nation_region_denormalized')").contains(
      "VALIDATE_PARALLEL: true"
    );
    cy.get("tr:contains('public.nation_region_denormalized')").contains(
      "memory:"
    );

    cy.get(
      "tr:contains('public.nation_region_denormalized\npublic.part_partsupp_supplier_denormalized')"
    ).contains("CLEAN_TEMP: true");
    cy.get(
      "tr:contains('public.nation_region_denormalized\npublic.part_partsupp_supplier_denormalized')"
    ).contains("DETECT_NARY: true");
    cy.get(
      "tr:contains('public.nation_region_denormalized\npublic.part_partsupp_supplier_denormalized')"
    ).contains("FILTER_KEY_FOREIGNKEYS: false");
    cy.get(
      "tr:contains('public.nation_region_denormalized\npublic.part_partsupp_supplier_denormalized')"
    ).contains("INPUT_ROW_LIMIT: -1");
    cy.get(
      "tr:contains('public.nation_region_denormalized\npublic.part_partsupp_supplier_denormalized')"
    ).contains("MAX_MEMORY_USAGE_PERCENTAGE: 60");
    cy.get(
      "tr:contains('public.nation_region_denormalized\npublic.part_partsupp_supplier_denormalized')"
    ).contains("MAX_NARY_LEVEL: 2");
    cy.get(
      "tr:contains('public.nation_region_denormalized\npublic.part_partsupp_supplier_denormalized')"
    ).contains("MEMORY_CHECK_FREQUENCY: 100");
    cy.get(
      "tr:contains('public.nation_region_denormalized\npublic.part_partsupp_supplier_denormalized')"
    ).contains("NUM_BUCKETS_PER_COLUMN: 10");
    cy.get(
      "tr:contains('public.nation_region_denormalized\npublic.part_partsupp_supplier_denormalized')"
    ).contains("TEMP_FOLDER_PATH: BINDER_temp");
    cy.get(
      "tr:contains('public.nation_region_denormalized\npublic.part_partsupp_supplier_denormalized')"
    ).contains("memory:");
  });

  it("chooses new default configuration settings (HyFD, HyFD, FAIDA) and loads schema editing page", () => {
    cy.get('[class="sbb-toggle-option-button-label"]:contains("HyFD")').click({
      multiple: true,
    });
    cy.contains("FAIDA").click();

    cy.contains("Ok").click();
    cy.url({ timeout: 2 * 60 * 1000 }).should("contain", "edit-schema");

    cy.visit(Cypress.env("FRONTEND_BASEURL") + "/#/metanome-results");
    cy.get("tr").should("have.length", 4);

    cy.get(
      "tr:contains('public.part_partsupp_supplier_denormalized')"
    ).contains("ENABLE_MEMORY_GUARDIAN: true");
    cy.get(
      "tr:contains('public.part_partsupp_supplier_denormalized')"
    ).contains("INPUT_ROW_LIMIT: -1");
    cy.get(
      "tr:contains('public.part_partsupp_supplier_denormalized')"
    ).contains("MAX_DETERMINANT_SIZE: -1");
    cy.get(
      "tr:contains('public.part_partsupp_supplier_denormalized')"
    ).contains("NULL_EQUALS_NULL: true");
    cy.get(
      "tr:contains('public.part_partsupp_supplier_denormalized')"
    ).contains("VALIDATE_PARALLEL: true");
    cy.get(
      "tr:contains('public.part_partsupp_supplier_denormalized')"
    ).contains("memory:");

    cy.get("tr:contains('public.nation_region_denormalized')").contains(
      "ENABLE_MEMORY_GUARDIAN: true"
    );
    cy.get("tr:contains('public.nation_region_denormalized')").contains(
      "INPUT_ROW_LIMIT: -1"
    );
    cy.get("tr:contains('public.nation_region_denormalized')").contains(
      "MAX_DETERMINANT_SIZE: -1"
    );
    cy.get("tr:contains('public.nation_region_denormalized')").contains(
      "NULL_EQUALS_NULL: true"
    );
    cy.get("tr:contains('public.nation_region_denormalized')").contains(
      "VALIDATE_PARALLEL: true"
    );
    cy.get("tr:contains('public.nation_region_denormalized')").contains(
      "memory:"
    );

    cy.get(
      "tr:contains('public.nation_region_denormalized\npublic.part_partsupp_supplier_denormalized')"
    ).contains("APPROXIMATE_TESTER: HLL");
    cy.get(
      "tr:contains('public.nation_region_denormalized\npublic.part_partsupp_supplier_denormalized')"
    ).contains("APPROXIMATE_TESTER_BYTES: 32768");
    cy.get(
      "tr:contains('public.nation_region_denormalized\npublic.part_partsupp_supplier_denormalized')"
    ).contains("DETECT_NARY: true");
    cy.get(
      "tr:contains('public.nation_region_denormalized\npublic.part_partsupp_supplier_denormalized')"
    ).contains("HLL_REL_STD_DEV: 0.01");
    cy.get(
      "tr:contains('public.nation_region_denormalized\npublic.part_partsupp_supplier_denormalized')"
    ).contains("IGNORE_CONSTANT: true");
    cy.get(
      "tr:contains('public.nation_region_denormalized\npublic.part_partsupp_supplier_denormalized')"
    ).contains("IGNORE_NULL: true");
    cy.get(
      "tr:contains('public.nation_region_denormalized\npublic.part_partsupp_supplier_denormalized')"
    ).contains("REUSE_COLUMN_STORE: false");
    cy.get(
      "tr:contains('public.nation_region_denormalized\npublic.part_partsupp_supplier_denormalized')"
    ).contains("SAMPLE_GOAL: 500");
    cy.get(
      "tr:contains('public.nation_region_denormalized\npublic.part_partsupp_supplier_denormalized')"
    ).contains("VIRTUAL_COLUMN_STORE: false");
    cy.get(
      "tr:contains('public.nation_region_denormalized\npublic.part_partsupp_supplier_denormalized')"
    ).contains("memory:");
  });

  it("chooses new random configuration settings (HyFD, HyFD, BINDER) and loads schema editing page", () => {
    cy.get("sbb-toggle-option:contains('HyFD')").click({ multiple: true });
    cy.contains("BINDER").click();

    cy.get(".memory").first().clear().type("1G");
    cy.get(".NULL_EQUALS_NULL").first().click();

    cy.get(".memory").eq(1).clear().type("2G");
    cy.get(".MAX_DETERMINANT_SIZE").eq(1).clear().type("4");

    cy.get(".MAX_NARY_LEVEL").first().clear().type("2");

    cy.contains("Ok").click();
    cy.url({ timeout: 2 * 60 * 1000 }).should("contain", "edit-schema");

    cy.visit(Cypress.env("FRONTEND_BASEURL") + "/#/metanome-results");
    cy.get("tr").should("have.length", 4);

    cy.get("tr:contains('public.nation_region_denormalized')").should(
      "contain",
      "memory: 1G",
      { force: true }
    );
    cy.get("tr:contains('public.nation_region_denormalized')").should(
      "contain",
      "NULL_EQUALS_NULL: false",
      { force: true }
    );

    cy.get("tr:contains('public.part_partsupp_supplier_denormalized')").should(
      "contain",
      "memory: 2G",
      { force: true }
    );
    cy.get("tr:contains('public.part_partsupp_supplier_denormalized')").should(
      "contain",
      "MAX_DETERMINANT_SIZE: 4",
      { force: true }
    );

    cy.get(
      "tr:contains('public.nation_region_denormalized\npublic.part_partsupp_supplier_denormalized')"
    ).should("contain", "DETECT_NARY: true", { force: true });
    cy.get(
      "tr:contains('public.nation_region_denormalized\npublic.part_partsupp_supplier_denormalized')"
    ).should("contain", "MAX_NARY_LEVEL: 2", { force: true });
  });

  it("chooses new random configuration settings (HyFD, HyFD, FAIDA) and loads schema editing page", () => {
    cy.get("sbb-toggle-option:contains('HyFD')").click({ multiple: true });
    cy.contains("FAIDA").click();

    cy.get(".memory").first().clear().type("200M");
    cy.get(".VALIDATE_PARALLEL").first().click();

    cy.get(".memory").eq(1).clear().type("100M");
    cy.get(".INPUT_ROW_LIMIT").eq(1).clear().type("3");

    cy.get(".IGNORE_NULL").first().click();
    cy.get(".SAMPLE_GOAL").first().clear().type("600");

    cy.contains("Ok").click();
    cy.url({ timeout: 2 * 60 * 1000 }).should("contain", "edit-schema");

    cy.visit(Cypress.env("FRONTEND_BASEURL") + "/#/metanome-results");
    cy.get("tr").should("have.length", 4);

    cy.get("tr:contains('public.nation_region_denormalized')").should(
      "contain",
      "memory: 200M",
      { force: true }
    );
    cy.get("tr:contains('public.nation_region_denormalized')").should(
      "contain",
      "VALIDATE_PARALLEL: false",
      { force: true }
    );

    cy.get("tr:contains('public.part_partsupp_supplier_denormalized')").should(
      "contain",
      "memory: 100M",
      { force: true }
    );
    cy.get("tr:contains('public.part_partsupp_supplier_denormalized')").should(
      "contain",
      "INPUT_ROW_LIMIT: 3",
      { force: true }
    );

    cy.get(
      "tr:contains('public.nation_region_denormalized\npublic.part_partsupp_supplier_denormalized')"
    ).should("contain", "IGNORE_NULL: false", { force: true });
    cy.get(
      "tr:contains('public.nation_region_denormalized\npublic.part_partsupp_supplier_denormalized')"
    ).should("contain", "SAMPLE_GOAL: 600", { force: true });
  });

  it("does not calculate fds and inds when using use no Metanome result tab", () => {
    cy.get('.sbb-toggle-option:contains("Use no Metanome result")').click({
      multiple: true,
    });
    cy.contains("Ok").click();
    cy.url({ timeout: 2 * 60 * 1000 }).should("contain", "edit-schema");
    cy.get(
      '.table-head-title:contains("public.nation_region_denormalized")'
    ).click();
    cy.visitContainedSubtableTab();
    cy.contains(
      "No contained subtables were found with the current filter for this table"
    );
    cy.visitPossibleForeignKeysTab();
    cy.contains(
      "No possible foreign keys were found with the current filter for this table"
    );
    cy.get(
      '.table-head-title:contains("public.part_partsupp_supplier_denormalized")'
    ).click({ force: true });
    cy.visitContainedSubtableTab();
    cy.contains(
      "No contained subtables were found with the current filter for this table"
    );
    cy.visitPossibleForeignKeysTab();
    cy.contains(
      "No possible foreign keys were found with the current filter for this table"
    );
  });

  it("does not calculate fds and inds when using use no Metanome result tab for one table", () => {
    cy.get('.sbb-toggle-option:contains("Use no Metanome result")')
      .eq(1)
      .click();
    cy.contains("Ok").click();
    cy.url({ timeout: 2 * 60 * 1000 }).should("contain", "edit-schema");
    cy.get(
      '.table-head-title:contains("public.nation_region_denormalized")'
    ).click();
    cy.visitContainedSubtableTab();
    cy.contains(
      "No contained subtables were found with the current filter for this table"
    ).should("not.exist");
    cy.visitPossibleForeignKeysTab();
    cy.contains(
      "No possible foreign keys were found with the current filter for this table"
    );
    cy.get(
      '.table-head-title:contains("public.part_partsupp_supplier_denormalized")'
    ).click({ force: true });
    cy.visitContainedSubtableTab();
    cy.contains(
      "No contained subtables were found with the current filter for this table"
    );
    cy.visitPossibleForeignKeysTab();
    cy.contains(
      "No possible foreign keys were found with the current filter for this table"
    ).should("not.exist");
  });
});
