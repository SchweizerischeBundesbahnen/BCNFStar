"use strict";

customElements.define(
  "compodoc-menu",
  class extends HTMLElement {
    constructor() {
      super();
      this.isNormalMode = this.getAttribute("mode") === "normal";
    }

    connectedCallback() {
      this.render(this.isNormalMode);
    }

    render(isNormalMode) {
      let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">bcnfstar-frontend documentation</a>
                </li>

                <li class="divider"></li>
                ${
                  isNormalMode
                    ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>`
                    : ""
                }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-toggle="collapse" ${
                              isNormalMode
                                ? 'data-target="#modules-links"'
                                : 'data-target="#xs-modules-links"'
                            }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${
                          isNormalMode
                            ? 'id="modules-links"'
                            : 'id="xs-modules-links"'
                        }>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link" >AppModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${
                                          isNormalMode
                                            ? 'data-target="#components-links-module-AppModule-f0b672a85f3be61df96f63cefb03e64be190dc269c79c7d66e7afe87de5b4d780a6d412a13e82c27654b5a6518994bfae1df0de298312ae51462f01ff15bc792"'
                                            : 'data-target="#xs-components-links-module-AppModule-f0b672a85f3be61df96f63cefb03e64be190dc269c79c7d66e7afe87de5b4d780a6d412a13e82c27654b5a6518994bfae1df0de298312ae51462f01ff15bc792"'
                                        }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${
                                          isNormalMode
                                            ? 'id="components-links-module-AppModule-f0b672a85f3be61df96f63cefb03e64be190dc269c79c7d66e7afe87de5b4d780a6d412a13e82c27654b5a6518994bfae1df0de298312ae51462f01ff15bc792"'
                                            : 'id="xs-components-links-module-AppModule-f0b672a85f3be61df96f63cefb03e64be190dc269c79c7d66e7afe87de5b4d780a6d412a13e82c27654b5a6518994bfae1df0de298312ae51462f01ff15bc792"'
                                        }>
                                            <li class="link">
                                                <a href="components/AppComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/CheckIndComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CheckIndComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ContainedSubtablesComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ContainedSubtablesComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/CustomFunctionalDependencySideBarComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CustomFunctionalDependencySideBarComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DatabaseTableViewerComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DatabaseTableViewerComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DirectDimensionDialogComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DirectDimensionDialogComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ForeignKeysComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ForeignKeysComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/GraphElementComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >GraphElementComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/HomeComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >HomeComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/JoinDialogComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >JoinDialogComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/KeysComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >KeysComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LoadSavedSchemaComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LoadSavedSchemaComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MetanomeResultsViewerComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MetanomeResultsViewerComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MetanomeSettingsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MetanomeSettingsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/PersistSchemaComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PersistSchemaComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SaveSchemaEditingComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SaveSchemaEditingComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SbbOptionAllComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SbbOptionAllComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SchemaEditingComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SchemaEditingComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SchemaEditingSideBarComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SchemaEditingSideBarComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SchemaGraphComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SchemaGraphComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SplitDialogComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SplitDialogComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TableEditingComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TableEditingComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TableSelectionComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TableSelectionComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/UndoRedoComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UndoRedoComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ViolatingRowsViewComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ViolatingRowsViewComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ViolatingRowsViewIndsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ViolatingRowsViewIndsComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/AppRoutingModule.html" data-type="entity-link" >AppRoutingModule</a>
                            </li>
                </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${
                          isNormalMode
                            ? 'data-target="#classes-links"'
                            : 'data-target="#xs-classes-links"'
                        }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${
                          isNormalMode
                            ? 'id="classes-links"'
                            : 'id="xs-classes-links"'
                        }>
                            <li class="link">
                                <a href="classes/AutoNormalizeCommand.html" data-type="entity-link" >AutoNormalizeCommand</a>
                            </li>
                            <li class="link">
                                <a href="classes/Column.html" data-type="entity-link" >Column</a>
                            </li>
                            <li class="link">
                                <a href="classes/ColumnCombination.html" data-type="entity-link" >ColumnCombination</a>
                            </li>
                            <li class="link">
                                <a href="classes/ColumnsTree.html" data-type="entity-link" >ColumnsTree</a>
                            </li>
                            <li class="link">
                                <a href="classes/Command.html" data-type="entity-link" >Command</a>
                            </li>
                            <li class="link">
                                <a href="classes/CommandProcessor.html" data-type="entity-link" >CommandProcessor</a>
                            </li>
                            <li class="link">
                                <a href="classes/DataQuery.html" data-type="entity-link" >DataQuery</a>
                            </li>
                            <li class="link">
                                <a href="classes/Delete.html" data-type="entity-link" >Delete</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeleteColumnCommand.html" data-type="entity-link" >DeleteColumnCommand</a>
                            </li>
                            <li class="link">
                                <a href="classes/DirectDimension.html" data-type="entity-link" >DirectDimension</a>
                            </li>
                            <li class="link">
                                <a href="classes/DirectDimensionCommand.html" data-type="entity-link" >DirectDimensionCommand</a>
                            </li>
                            <li class="link">
                                <a href="classes/FdScore.html" data-type="entity-link" >FdScore</a>
                            </li>
                            <li class="link">
                                <a href="classes/FunctionalDependency.html" data-type="entity-link" >FunctionalDependency</a>
                            </li>
                            <li class="link">
                                <a href="classes/IndScore.html" data-type="entity-link" >IndScore</a>
                            </li>
                            <li class="link">
                                <a href="classes/IndToFkCommand.html" data-type="entity-link" >IndToFkCommand</a>
                            </li>
                            <li class="link">
                                <a href="classes/Join.html" data-type="entity-link" >Join</a>
                            </li>
                            <li class="link">
                                <a href="classes/JoinCommand.html" data-type="entity-link" >JoinCommand</a>
                            </li>
                            <li class="link">
                                <a href="classes/MsSqlPersisting.html" data-type="entity-link" >MsSqlPersisting</a>
                            </li>
                            <li class="link">
                                <a href="classes/PostgreSQLPersisting.html" data-type="entity-link" >PostgreSQLPersisting</a>
                            </li>
                            <li class="link">
                                <a href="classes/Relationship.html" data-type="entity-link" >Relationship</a>
                            </li>
                            <li class="link">
                                <a href="classes/SaveSchemaState.html" data-type="entity-link" >SaveSchemaState</a>
                            </li>
                            <li class="link">
                                <a href="classes/Schema.html" data-type="entity-link" >Schema</a>
                            </li>
                            <li class="link">
                                <a href="classes/SourceColumn.html" data-type="entity-link" >SourceColumn</a>
                            </li>
                            <li class="link">
                                <a href="classes/SourceFunctionalDependency.html" data-type="entity-link" >SourceFunctionalDependency</a>
                            </li>
                            <li class="link">
                                <a href="classes/SourceRelationship.html" data-type="entity-link" >SourceRelationship</a>
                            </li>
                            <li class="link">
                                <a href="classes/SourceTable.html" data-type="entity-link" >SourceTable</a>
                            </li>
                            <li class="link">
                                <a href="classes/SourceTableInstance.html" data-type="entity-link" >SourceTableInstance</a>
                            </li>
                            <li class="link">
                                <a href="classes/Split.html" data-type="entity-link" >Split</a>
                            </li>
                            <li class="link">
                                <a href="classes/SplitCommand.html" data-type="entity-link" >SplitCommand</a>
                            </li>
                            <li class="link">
                                <a href="classes/SQLPersisting.html" data-type="entity-link" >SQLPersisting</a>
                            </li>
                            <li class="link">
                                <a href="classes/Table.html" data-type="entity-link" >Table</a>
                            </li>
                            <li class="link">
                                <a href="classes/TableRelationship.html" data-type="entity-link" >TableRelationship</a>
                            </li>
                            <li class="link">
                                <a href="classes/ViolatingFDRowsDataQuery.html" data-type="entity-link" >ViolatingFDRowsDataQuery</a>
                            </li>
                            <li class="link">
                                <a href="classes/ViolatingINDRowsDataQuery.html" data-type="entity-link" >ViolatingINDRowsDataQuery</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-toggle="collapse" ${
                              isNormalMode
                                ? 'data-target="#injectables-links"'
                                : 'data-target="#xs-injectables-links"'
                            }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${
                              isNormalMode
                                ? 'id="injectables-links"'
                                : 'id="xs-injectables-links"'
                            }>
                                <li class="link">
                                    <a href="injectables/DatabaseService.html" data-type="entity-link" >DatabaseService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SchemaCreationService.html" data-type="entity-link" >SchemaCreationService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${
                          isNormalMode
                            ? 'data-target="#interfaces-links"'
                            : 'data-target="#xs-interfaces-links"'
                        }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${
                          isNormalMode
                            ? ' id="interfaces-links"'
                            : 'id="xs-interfaces-links"'
                        }>
                            <li class="link">
                                <a href="interfaces/BasicColumn.html" data-type="entity-link" >BasicColumn</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FdCluster.html" data-type="entity-link" >FdCluster</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/JSONColumn.html" data-type="entity-link" >JSONColumn</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/JSONColumnCombination.html" data-type="entity-link" >JSONColumnCombination</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/JSONRelationship.html" data-type="entity-link" >JSONRelationship</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/JSONSchema.html" data-type="entity-link" >JSONSchema</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/JSONSourceColumn.html" data-type="entity-link" >JSONSourceColumn</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/JSONSourceFunctionalDependency.html" data-type="entity-link" >JSONSourceFunctionalDependency</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/JSONSourceRelationship.html" data-type="entity-link" >JSONSourceRelationship</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/JSONSourceTable.html" data-type="entity-link" >JSONSourceTable</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/JSONSourceTableInstance.html" data-type="entity-link" >JSONSourceTableInstance</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/JSONTable.html" data-type="entity-link" >JSONTable</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${
                          isNormalMode
                            ? 'data-target="#miscellaneous-links"'
                            : 'data-target="#xs-miscellaneous-links"'
                        }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${
                          isNormalMode
                            ? 'id="miscellaneous-links"'
                            : 'id="xs-miscellaneous-links"'
                        }>
                            <li class="link">
                                <a href="miscellaneous/enumerations.html" data-type="entity-link">Enums</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <a data-type="chapter-link" href="routes.html"><span class="icon ion-ios-git-branch"></span>Routes</a>
                        </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
      this.innerHTML = tp.strings;
    }
  }
);
