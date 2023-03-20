# Contributing to BCNFStar

You want to contribute to BCNFStar? That's awesome! Ideas of any kind are always welcome. Feel free to open issues (follow the template when reporting bugs)
and pull requests. It might be beneficial to create an issue or contact the repository admins in any way before opening a pull request to make sure that
your code will be most valuable to the project and you do not code something in vain. Also feel free to ask us whenever you need any help.

## Setting up

First, follow the installation instructions found in the [README](https://github.com/HPI-Information-Systems/BCNFStar/blob/main/README.md)

Additionally, you should create a postres database and load the test data into it with

```bash
createdb <test_db_name>
pg_restore -d <test_db_name> -O -c < cypress/postgres_1MB_testdata_denormalized.sql
```

Note that the test data for mssql is currently different and won't make the tests pass
You also need to add that test database to

## Developing

We recommend to delevop with the following command. This will host hot-reloading development servers for both the frontend (port 4200) and backend (port 80), and will automatically run tests whenever anything is changed:

```bash
npm run test:dev
```

Alternatively, you can use `npm run dev` if you don't want tests to be run

To run the tests as they are being executed in the CI, run `npm run test:prod`.

### Testing SaveSchemaState

There is a feature called _save intermediate state_ in BCNFStar which allows users to download and restore working copies of schemas containing all transformations they already did. If you change any fields in the data model, you will likely need to edit this feature as well.
If you change the persisting of the model in [SaveSchemaState.ts](/frontend/src/model/schema/methodObjects/SaveSchemaState.ts) and other schema files you always have to update the zip files [savedExampleSchema.zip](/cypress/fixtures/savedExampleSchema.zip) and [savedSchema.zip](/cypress/fixtures/savedSchema.zip) in cypress forlder [Fixtures](/cypress/fixtures) for tests [load-saved-schema.cy.ts](/cypress/e2e/frontend/components/load-saved-schema.cy.ts) and [tables-selection.cy.ts](/cypress/e2e/frontend/pages/tables-selection.cy.ts).

How to generate these files

1. If not already done for testing, load the test database from `cypress/mssql_1MB_testdata_denormalized.sql` or `cypress/postgres_1MB_testdata_denormalized.sql`
1. Make sure to update the database connection details (see Database section of the README)
1. Start BCNFStar with `npm run dev` and visit `http://localhost:4200`
1. Select the tables `public.nation_region_denormalized` and `public.part_partsupp_supplier_denormalized`
1. Select metanome results and go
1. Type `savedSchema` in the textbox labelled `file name`, download the file and store it under `cypress/fixtures`
1. Do some arbitrary schema operations. Which ones you do does not matter, but they should ideally cover a range of BCNFStar's features, and especially the ones you just edited. While testing, we check if loading and saving this file again yields the same result.
1. Save this schema as `savedExampleSchema` and also store it in `cypress/fixtures`
1. Run `npm run test:dev` and make sure the tests [load-saved-schema.cy.ts](/cypress/e2e/frontend/components/load-saved-schema.cy.ts) and [tables-selection.cy.ts](/cypress/e2e/frontend/pages/tables-selection.cy.ts) run through```

### Troubleshooting

Something doesn't work? Always try to run `npm install && npm run build` first. This may be required after changes to files in the `server/definitions` folder or to any dependency.
You don't know what this monster function is supposed to do? Maybe our documentation will help you: [index.html](/docs/index.html).

## Metanome modifications

The source code of our custom metanome algorithms JARs (HyFDExtended and RustFD) can be found at [HyFDExtended](https://github.com/PaulVII/HyFDExtended)

We also use a custom version of [metanome-cli](https://github.com/rothaarlappen/metanome-cli) enabling Microsoft SQL Server support. This is required because Microsoft SQL Server has a special JDBC URL format. The relevant changes are in `src/main/java/de/metanome/cli/App.java` in the method `loadConfigurationSettingDatabaseConnection`. For completeness, we also added an MsSql database type and the mssql JDBC drivers as a dependency to [Metanome](https://github.com/rothaarlappen/metanome), but this is likely optional since the JDBC driver JAR file has to be specified whenever metanome-cli is called

## Pull Request checklist

Make sure that...

- [ ] ...the linters pass (should be executed automatically as a pre-commit hook)
- [ ] ...new features are covered by tests
- [ ] ...the tests pass when running `npm run test:prod`
- [ ] ...you use jsdoc comments for all non-trivial functions and for difficult code segments
