import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require("./cypress/plugins/index.js")(on, config);
    },
    viewportWidth: 1000 * 1.2,
    viewportHeight: 660 * 1.2,
  },
});
