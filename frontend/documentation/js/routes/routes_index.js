var ROUTES_INDEX = {
  name: "<root>",
  kind: "module",
  className: "AppModule",
  children: [
    {
      name: "routes",
      filename: "src/app/app-routing.module.ts",
      module: "AppRoutingModule",
      children: [
        { path: "", component: "HomeComponent" },
        { path: "edit-schema", component: "SchemaEditingComponent" },
        {
          path: "metanome-results",
          component: "MetanomeResultsViewerComponent",
        },
      ],
      kind: "module",
    },
  ],
};
