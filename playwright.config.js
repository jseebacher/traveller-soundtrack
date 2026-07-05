// @ts-check
const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  webServer: {
    command: "node serve.js 8123",
    url: "http://localhost:8123",
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: "http://localhost:8123",
  },
});
