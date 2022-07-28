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

### Troubleshooting

Something doesn't work? Always try to run `npm install && npm run build` first. This may be required after changes to files in the `server/definitions` folder or to any dependency.
You don't know what this monster function is supposed to do? Maybe our documentation will help you: [index.html](/docs/index.html).

## Pull Request checklist

Make sure that...

- [ ] ...the linters pass (should be executed automatically as a pre-commit hook)
- [ ] ...new features are covered by tests
- [ ] ...the tests pass when running `npm run test:prod`
- [ ] ...you use jsdoc comments for all non-trivial functions and for difficult code segments
