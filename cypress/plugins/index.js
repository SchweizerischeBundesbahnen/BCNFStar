/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

/**
 * @type {Cypress.PluginConfig}
 */
// eslint-disable-next-line no-unused-vars
module.exports = (on, config) => {
  config = require("cypress-dotenv")(config);

  const db = {
    user: config.env.PGUSER,
    password: config.env.PGPASSWORD,
    host: config.env.PGHOST,
    port: config.env.PGPORT,
    database: config.env.PGDATABASE,
  };

  on("task", {
    dbQuery: (query) =>
      require("cypress-postgres")(query.query, Object.assign({}, db)),
  });

  const { rmdir } = require("fs");
  on("task", {
    deleteFolder(folderName) {
      return new Promise((resolve, reject) => {
        rmdir(folderName, { maxRetries: 10, recursive: true }, (err) => {
          if (err) {
            console.error(err);
            return reject(err);
          }
          resolve(null);
        });
      });
    },
  });
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config

  // require("@cypress/code-coverage/task")(on, config);
  if (!config.env.BACKEND_BASEURL)
    config.env.BACKEND_BASEURL = "http://localhost:80";
  config.env.codeCoverage = {
    url: config.env.BACKEND_BASEURL + "/__coverage__",
  };
  return config;
};
