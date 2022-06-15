/// <reference types="cypress" />

describe("The check-fd component should display violating rows for custom fds", () => {
  beforeEach(() => {
    cy.visitFrontend();
    cy.selectSpecificTablesAndGo("public", [
      "nation_region_denormalized",
      "part_partsupp_supplier_denormalized",
    ]);
    cy.loadMetanomeConfigAndOk();
    cy.clickOnTable("public.nation_region_denormalized");
    cy.visitCheckContainedSubtableTab();
  });

  it("opens violating rows dialog for invalid fd", () => {
    cy.checkFD(
      ["r_comment"],
      ["r_name", "r_regionkey", "n_name", "n_regionkey"]
    );
    cy.contains("Violating Rows for suggested Contained Subtable");
  });

  it("doesn't open dialog for valid fd", () => {
    cy.checkFD(["n_nationkey"], ["r_comment"]);
    cy.contains("Violating Rows for suggested Contained Subtable").should(
      "not.exist"
    );
    cy.contains("FD is valid");
  });

  it("allows fd check on multi-tables", () => {
    cy.joinTablesByFirstIND(
      "public.part_partsupp_supplier_denormalized",
      "public.nation_region_denormalized"
    );
    cy.visitCheckContainedSubtableTab();

    cy.checkFD(
      ["n_comment", "n_name"],
      ["ps_partkey", "p_mfgr", "p_brand", "p_type"]
    );

    cy.contains("Violating Rows for suggested Contained Subtable");
  });

  it("selecting same column for lhs and rhs results in valid fd", () => {
    cy.checkFD(["n_comment"], ["n_comment"]);
    cy.contains("FD is valid");
  });
});
