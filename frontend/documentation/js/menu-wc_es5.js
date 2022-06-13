"use strict";

function _typeof(obj) {
  "@babel/helpers - typeof";
  return (
    (_typeof =
      "function" == typeof Symbol && "symbol" == typeof Symbol.iterator
        ? function (obj) {
            return typeof obj;
          }
        : function (obj) {
            return obj &&
              "function" == typeof Symbol &&
              obj.constructor === Symbol &&
              obj !== Symbol.prototype
              ? "symbol"
              : typeof obj;
          }),
    _typeof(obj)
  );
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  Object.defineProperty(Constructor, "prototype", { writable: false });
  return Constructor;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: { value: subClass, writable: true, configurable: true },
  });
  Object.defineProperty(subClass, "prototype", { writable: false });
  if (superClass) _setPrototypeOf(subClass, superClass);
}

function _createSuper(Derived) {
  var hasNativeReflectConstruct = _isNativeReflectConstruct();
  return function _createSuperInternal() {
    var Super = _getPrototypeOf(Derived),
      result;
    if (hasNativeReflectConstruct) {
      var NewTarget = _getPrototypeOf(this).constructor;
      result = Reflect.construct(Super, arguments, NewTarget);
    } else {
      result = Super.apply(this, arguments);
    }
    return _possibleConstructorReturn(this, result);
  };
}

function _possibleConstructorReturn(self, call) {
  if (call && (_typeof(call) === "object" || typeof call === "function")) {
    return call;
  } else if (call !== void 0) {
    throw new TypeError(
      "Derived constructors may only return object or undefined"
    );
  }
  return _assertThisInitialized(self);
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError(
      "this hasn't been initialised - super() hasn't been called"
    );
  }
  return self;
}

function _wrapNativeSuper(Class) {
  var _cache = typeof Map === "function" ? new Map() : undefined;
  _wrapNativeSuper = function _wrapNativeSuper(Class) {
    if (Class === null || !_isNativeFunction(Class)) return Class;
    if (typeof Class !== "function") {
      throw new TypeError("Super expression must either be null or a function");
    }
    if (typeof _cache !== "undefined") {
      if (_cache.has(Class)) return _cache.get(Class);
      _cache.set(Class, Wrapper);
    }
    function Wrapper() {
      return _construct(Class, arguments, _getPrototypeOf(this).constructor);
    }
    Wrapper.prototype = Object.create(Class.prototype, {
      constructor: {
        value: Wrapper,
        enumerable: false,
        writable: true,
        configurable: true,
      },
    });
    return _setPrototypeOf(Wrapper, Class);
  };
  return _wrapNativeSuper(Class);
}

function _construct(Parent, args, Class) {
  if (_isNativeReflectConstruct()) {
    _construct = Reflect.construct.bind();
  } else {
    _construct = function _construct(Parent, args, Class) {
      var a = [null];
      a.push.apply(a, args);
      var Constructor = Function.bind.apply(Parent, a);
      var instance = new Constructor();
      if (Class) _setPrototypeOf(instance, Class.prototype);
      return instance;
    };
  }
  return _construct.apply(null, arguments);
}

function _isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === "function") return true;
  try {
    Boolean.prototype.valueOf.call(
      Reflect.construct(Boolean, [], function () {})
    );
    return true;
  } catch (e) {
    return false;
  }
}

function _isNativeFunction(fn) {
  return Function.toString.call(fn).indexOf("[native code]") !== -1;
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf
    ? Object.setPrototypeOf.bind()
    : function _setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
      };
  return _setPrototypeOf(o, p);
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf
    ? Object.getPrototypeOf.bind()
    : function _getPrototypeOf(o) {
        return o.__proto__ || Object.getPrototypeOf(o);
      };
  return _getPrototypeOf(o);
}

customElements.define(
  "compodoc-menu",
  /*#__PURE__*/ (function (_HTMLElement) {
    _inherits(_class, _HTMLElement);

    var _super = _createSuper(_class);

    function _class() {
      var _this;

      _classCallCheck(this, _class);

      _this = _super.call(this);
      _this.isNormalMode = _this.getAttribute("mode") === "normal";
      return _this;
    }

    _createClass(_class, [
      {
        key: "connectedCallback",
        value: function connectedCallback() {
          this.render(this.isNormalMode);
        },
      },
      {
        key: "render",
        value: function render(isNormalMode) {
          var tp = lithtml.html(
            '\n        <nav>\n            <ul class="list">\n                <li class="title">\n                    <a href="index.html" data-type="index-link">bcnfstar-frontend documentation</a>\n                </li>\n\n                <li class="divider"></li>\n                '
              .concat(
                isNormalMode
                  ? '<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>'
                  : "",
                '\n                <li class="chapter">\n                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>\n                    <ul class="links">\n                        <li class="link">\n                            <a href="overview.html" data-type="chapter-link">\n                                <span class="icon ion-ios-keypad"></span>Overview\n                            </a>\n                        </li>\n                        <li class="link">\n                            <a href="index.html" data-type="chapter-link">\n                                <span class="icon ion-ios-paper"></span>README\n                            </a>\n                        </li>\n                                <li class="link">\n                                    <a href="dependencies.html" data-type="chapter-link">\n                                        <span class="icon ion-ios-list"></span>Dependencies\n                                    </a>\n                                </li>\n                                <li class="link">\n                                    <a href="properties.html" data-type="chapter-link">\n                                        <span class="icon ion-ios-apps"></span>Properties\n                                    </a>\n                                </li>\n                    </ul>\n                </li>\n                    <li class="chapter modules">\n                        <a data-type="chapter-link" href="modules.html">\n                            <div class="menu-toggler linked" data-toggle="collapse" '
              )
              .concat(
                isNormalMode
                  ? 'data-target="#modules-links"'
                  : 'data-target="#xs-modules-links"',
                '>\n                                <span class="icon ion-ios-archive"></span>\n                                <span class="link-name">Modules</span>\n                                <span class="icon ion-ios-arrow-down"></span>\n                            </div>\n                        </a>\n                        <ul class="links collapse " '
              )
              .concat(
                isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"',
                '>\n                            <li class="link">\n                                <a href="modules/AppModule.html" data-type="entity-link" >AppModule</a>\n                                    <li class="chapter inner">\n                                        <div class="simple menu-toggler" data-toggle="collapse" '
              )
              .concat(
                isNormalMode
                  ? 'data-target="#components-links-module-AppModule-f0b672a85f3be61df96f63cefb03e64be190dc269c79c7d66e7afe87de5b4d780a6d412a13e82c27654b5a6518994bfae1df0de298312ae51462f01ff15bc792"'
                  : 'data-target="#xs-components-links-module-AppModule-f0b672a85f3be61df96f63cefb03e64be190dc269c79c7d66e7afe87de5b4d780a6d412a13e82c27654b5a6518994bfae1df0de298312ae51462f01ff15bc792"',
                '>\n                                            <span class="icon ion-md-cog"></span>\n                                            <span>Components</span>\n                                            <span class="icon ion-ios-arrow-down"></span>\n                                        </div>\n                                        <ul class="links collapse" '
              )
              .concat(
                isNormalMode
                  ? 'id="components-links-module-AppModule-f0b672a85f3be61df96f63cefb03e64be190dc269c79c7d66e7afe87de5b4d780a6d412a13e82c27654b5a6518994bfae1df0de298312ae51462f01ff15bc792"'
                  : 'id="xs-components-links-module-AppModule-f0b672a85f3be61df96f63cefb03e64be190dc269c79c7d66e7afe87de5b4d780a6d412a13e82c27654b5a6518994bfae1df0de298312ae51462f01ff15bc792"',
                '>\n                                            <li class="link">\n                                                <a href="components/AppComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppComponent</a>\n                                            </li>\n                                            <li class="link">\n                                                <a href="components/CheckIndComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CheckIndComponent</a>\n                                            </li>\n                                            <li class="link">\n                                                <a href="components/ContainedSubtablesComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ContainedSubtablesComponent</a>\n                                            </li>\n                                            <li class="link">\n                                                <a href="components/CustomFunctionalDependencySideBarComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CustomFunctionalDependencySideBarComponent</a>\n                                            </li>\n                                            <li class="link">\n                                                <a href="components/DatabaseTableViewerComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DatabaseTableViewerComponent</a>\n                                            </li>\n                                            <li class="link">\n                                                <a href="components/DirectDimensionDialogComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DirectDimensionDialogComponent</a>\n                                            </li>\n                                            <li class="link">\n                                                <a href="components/ForeignKeysComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ForeignKeysComponent</a>\n                                            </li>\n                                            <li class="link">\n                                                <a href="components/GraphElementComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >GraphElementComponent</a>\n                                            </li>\n                                            <li class="link">\n                                                <a href="components/HomeComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >HomeComponent</a>\n                                            </li>\n                                            <li class="link">\n                                                <a href="components/JoinDialogComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >JoinDialogComponent</a>\n                                            </li>\n                                            <li class="link">\n                                                <a href="components/KeysComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >KeysComponent</a>\n                                            </li>\n                                            <li class="link">\n                                                <a href="components/LoadSavedSchemaComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LoadSavedSchemaComponent</a>\n                                            </li>\n                                            <li class="link">\n                                                <a href="components/MetanomeResultsViewerComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MetanomeResultsViewerComponent</a>\n                                            </li>\n                                            <li class="link">\n                                                <a href="components/MetanomeSettingsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MetanomeSettingsComponent</a>\n                                            </li>\n                                            <li class="link">\n                                                <a href="components/PersistSchemaComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PersistSchemaComponent</a>\n                                            </li>\n                                            <li class="link">\n                                                <a href="components/SaveSchemaEditingComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SaveSchemaEditingComponent</a>\n                                            </li>\n                                            <li class="link">\n                                                <a href="components/SbbOptionAllComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SbbOptionAllComponent</a>\n                                            </li>\n                                            <li class="link">\n                                                <a href="components/SchemaEditingComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SchemaEditingComponent</a>\n                                            </li>\n                                            <li class="link">\n                                                <a href="components/SchemaEditingSideBarComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SchemaEditingSideBarComponent</a>\n                                            </li>\n                                            <li class="link">\n                                                <a href="components/SchemaGraphComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SchemaGraphComponent</a>\n                                            </li>\n                                            <li class="link">\n                                                <a href="components/SplitDialogComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SplitDialogComponent</a>\n                                            </li>\n                                            <li class="link">\n                                                <a href="components/TableEditingComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TableEditingComponent</a>\n                                            </li>\n                                            <li class="link">\n                                                <a href="components/TableSelectionComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TableSelectionComponent</a>\n                                            </li>\n                                            <li class="link">\n                                                <a href="components/UndoRedoComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UndoRedoComponent</a>\n                                            </li>\n                                            <li class="link">\n                                                <a href="components/ViolatingRowsViewComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ViolatingRowsViewComponent</a>\n                                            </li>\n                                            <li class="link">\n                                                <a href="components/ViolatingRowsViewIndsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ViolatingRowsViewIndsComponent</a>\n                                            </li>\n                                        </ul>\n                                    </li>\n                            </li>\n                            <li class="link">\n                                <a href="modules/AppRoutingModule.html" data-type="entity-link" >AppRoutingModule</a>\n                            </li>\n                </ul>\n                </li>\n                    <li class="chapter">\n                        <div class="simple menu-toggler" data-toggle="collapse" '
              )
              .concat(
                isNormalMode
                  ? 'data-target="#classes-links"'
                  : 'data-target="#xs-classes-links"',
                '>\n                            <span class="icon ion-ios-paper"></span>\n                            <span>Classes</span>\n                            <span class="icon ion-ios-arrow-down"></span>\n                        </div>\n                        <ul class="links collapse " '
              )
              .concat(
                isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"',
                '>\n                            <li class="link">\n                                <a href="classes/AutoNormalizeCommand.html" data-type="entity-link" >AutoNormalizeCommand</a>\n                            </li>\n                            <li class="link">\n                                <a href="classes/Column.html" data-type="entity-link" >Column</a>\n                            </li>\n                            <li class="link">\n                                <a href="classes/ColumnCombination.html" data-type="entity-link" >ColumnCombination</a>\n                            </li>\n                            <li class="link">\n                                <a href="classes/ColumnsTree.html" data-type="entity-link" >ColumnsTree</a>\n                            </li>\n                            <li class="link">\n                                <a href="classes/Command.html" data-type="entity-link" >Command</a>\n                            </li>\n                            <li class="link">\n                                <a href="classes/CommandProcessor.html" data-type="entity-link" >CommandProcessor</a>\n                            </li>\n                            <li class="link">\n                                <a href="classes/DataQuery.html" data-type="entity-link" >DataQuery</a>\n                            </li>\n                            <li class="link">\n                                <a href="classes/Delete.html" data-type="entity-link" >Delete</a>\n                            </li>\n                            <li class="link">\n                                <a href="classes/DeleteColumnCommand.html" data-type="entity-link" >DeleteColumnCommand</a>\n                            </li>\n                            <li class="link">\n                                <a href="classes/DirectDimension.html" data-type="entity-link" >DirectDimension</a>\n                            </li>\n                            <li class="link">\n                                <a href="classes/DirectDimensionCommand.html" data-type="entity-link" >DirectDimensionCommand</a>\n                            </li>\n                            <li class="link">\n                                <a href="classes/FdScore.html" data-type="entity-link" >FdScore</a>\n                            </li>\n                            <li class="link">\n                                <a href="classes/FunctionalDependency.html" data-type="entity-link" >FunctionalDependency</a>\n                            </li>\n                            <li class="link">\n                                <a href="classes/IndScore.html" data-type="entity-link" >IndScore</a>\n                            </li>\n                            <li class="link">\n                                <a href="classes/IndToFkCommand.html" data-type="entity-link" >IndToFkCommand</a>\n                            </li>\n                            <li class="link">\n                                <a href="classes/Join.html" data-type="entity-link" >Join</a>\n                            </li>\n                            <li class="link">\n                                <a href="classes/JoinCommand.html" data-type="entity-link" >JoinCommand</a>\n                            </li>\n                            <li class="link">\n                                <a href="classes/MsSqlPersisting.html" data-type="entity-link" >MsSqlPersisting</a>\n                            </li>\n                            <li class="link">\n                                <a href="classes/PostgreSQLPersisting.html" data-type="entity-link" >PostgreSQLPersisting</a>\n                            </li>\n                            <li class="link">\n                                <a href="classes/Relationship.html" data-type="entity-link" >Relationship</a>\n                            </li>\n                            <li class="link">\n                                <a href="classes/SaveSchemaState.html" data-type="entity-link" >SaveSchemaState</a>\n                            </li>\n                            <li class="link">\n                                <a href="classes/Schema.html" data-type="entity-link" >Schema</a>\n                            </li>\n                            <li class="link">\n                                <a href="classes/SourceColumn.html" data-type="entity-link" >SourceColumn</a>\n                            </li>\n                            <li class="link">\n                                <a href="classes/SourceFunctionalDependency.html" data-type="entity-link" >SourceFunctionalDependency</a>\n                            </li>\n                            <li class="link">\n                                <a href="classes/SourceRelationship.html" data-type="entity-link" >SourceRelationship</a>\n                            </li>\n                            <li class="link">\n                                <a href="classes/SourceTable.html" data-type="entity-link" >SourceTable</a>\n                            </li>\n                            <li class="link">\n                                <a href="classes/SourceTableInstance.html" data-type="entity-link" >SourceTableInstance</a>\n                            </li>\n                            <li class="link">\n                                <a href="classes/Split.html" data-type="entity-link" >Split</a>\n                            </li>\n                            <li class="link">\n                                <a href="classes/SplitCommand.html" data-type="entity-link" >SplitCommand</a>\n                            </li>\n                            <li class="link">\n                                <a href="classes/SQLPersisting.html" data-type="entity-link" >SQLPersisting</a>\n                            </li>\n                            <li class="link">\n                                <a href="classes/Table.html" data-type="entity-link" >Table</a>\n                            </li>\n                            <li class="link">\n                                <a href="classes/TableRelationship.html" data-type="entity-link" >TableRelationship</a>\n                            </li>\n                            <li class="link">\n                                <a href="classes/ViolatingFDRowsDataQuery.html" data-type="entity-link" >ViolatingFDRowsDataQuery</a>\n                            </li>\n                            <li class="link">\n                                <a href="classes/ViolatingINDRowsDataQuery.html" data-type="entity-link" >ViolatingINDRowsDataQuery</a>\n                            </li>\n                        </ul>\n                    </li>\n                        <li class="chapter">\n                            <div class="simple menu-toggler" data-toggle="collapse" '
              )
              .concat(
                isNormalMode
                  ? 'data-target="#injectables-links"'
                  : 'data-target="#xs-injectables-links"',
                '>\n                                <span class="icon ion-md-arrow-round-down"></span>\n                                <span>Injectables</span>\n                                <span class="icon ion-ios-arrow-down"></span>\n                            </div>\n                            <ul class="links collapse " '
              )
              .concat(
                isNormalMode
                  ? 'id="injectables-links"'
                  : 'id="xs-injectables-links"',
                '>\n                                <li class="link">\n                                    <a href="injectables/DatabaseService.html" data-type="entity-link" >DatabaseService</a>\n                                </li>\n                                <li class="link">\n                                    <a href="injectables/SchemaCreationService.html" data-type="entity-link" >SchemaCreationService</a>\n                                </li>\n                            </ul>\n                        </li>\n                    <li class="chapter">\n                        <div class="simple menu-toggler" data-toggle="collapse" '
              )
              .concat(
                isNormalMode
                  ? 'data-target="#interfaces-links"'
                  : 'data-target="#xs-interfaces-links"',
                '>\n                            <span class="icon ion-md-information-circle-outline"></span>\n                            <span>Interfaces</span>\n                            <span class="icon ion-ios-arrow-down"></span>\n                        </div>\n                        <ul class="links collapse " '
              )
              .concat(
                isNormalMode
                  ? ' id="interfaces-links"'
                  : 'id="xs-interfaces-links"',
                '>\n                            <li class="link">\n                                <a href="interfaces/BasicColumn.html" data-type="entity-link" >BasicColumn</a>\n                            </li>\n                            <li class="link">\n                                <a href="interfaces/FdCluster.html" data-type="entity-link" >FdCluster</a>\n                            </li>\n                            <li class="link">\n                                <a href="interfaces/JSONColumn.html" data-type="entity-link" >JSONColumn</a>\n                            </li>\n                            <li class="link">\n                                <a href="interfaces/JSONColumnCombination.html" data-type="entity-link" >JSONColumnCombination</a>\n                            </li>\n                            <li class="link">\n                                <a href="interfaces/JSONRelationship.html" data-type="entity-link" >JSONRelationship</a>\n                            </li>\n                            <li class="link">\n                                <a href="interfaces/JSONSchema.html" data-type="entity-link" >JSONSchema</a>\n                            </li>\n                            <li class="link">\n                                <a href="interfaces/JSONSourceColumn.html" data-type="entity-link" >JSONSourceColumn</a>\n                            </li>\n                            <li class="link">\n                                <a href="interfaces/JSONSourceFunctionalDependency.html" data-type="entity-link" >JSONSourceFunctionalDependency</a>\n                            </li>\n                            <li class="link">\n                                <a href="interfaces/JSONSourceRelationship.html" data-type="entity-link" >JSONSourceRelationship</a>\n                            </li>\n                            <li class="link">\n                                <a href="interfaces/JSONSourceTable.html" data-type="entity-link" >JSONSourceTable</a>\n                            </li>\n                            <li class="link">\n                                <a href="interfaces/JSONSourceTableInstance.html" data-type="entity-link" >JSONSourceTableInstance</a>\n                            </li>\n                            <li class="link">\n                                <a href="interfaces/JSONTable.html" data-type="entity-link" >JSONTable</a>\n                            </li>\n                        </ul>\n                    </li>\n                    <li class="chapter">\n                        <div class="simple menu-toggler" data-toggle="collapse" '
              )
              .concat(
                isNormalMode
                  ? 'data-target="#miscellaneous-links"'
                  : 'data-target="#xs-miscellaneous-links"',
                '>\n                            <span class="icon ion-ios-cube"></span>\n                            <span>Miscellaneous</span>\n                            <span class="icon ion-ios-arrow-down"></span>\n                        </div>\n                        <ul class="links collapse " '
              )
              .concat(
                isNormalMode
                  ? 'id="miscellaneous-links"'
                  : 'id="xs-miscellaneous-links"',
                '>\n                            <li class="link">\n                                <a href="miscellaneous/enumerations.html" data-type="entity-link">Enums</a>\n                            </li>\n                            <li class="link">\n                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>\n                            </li>\n                            <li class="link">\n                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>\n                            </li>\n                            <li class="link">\n                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>\n                            </li>\n                        </ul>\n                    </li>\n                        <li class="chapter">\n                            <a data-type="chapter-link" href="routes.html"><span class="icon ion-ios-git-branch"></span>Routes</a>\n                        </li>\n                    <li class="chapter">\n                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>\n                    </li>\n                    <li class="divider"></li>\n                    <li class="copyright">\n                        Documentation generated using <a href="https://compodoc.app/" target="_blank">\n                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">\n                        </a>\n                    </li>\n            </ul>\n        </nav>\n        '
              )
          );
          this.innerHTML = tp.strings;
        },
      },
    ]);

    return _class;
  })(/*#__PURE__*/ _wrapNativeSuper(HTMLElement))
);
