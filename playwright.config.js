const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests',
    timeout: 30000,
    expect: {
        timeout: 10000,
    },
    use: {
        baseURL: 'http://localhost/agrostock/frontend',
        browserName: 'firefox',
        headless: true,
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
    },
    projects: [
        {
            name: 'firefox',
            use: { browserName: 'firefox' },
        },
    ],
    reporter: 'list',
});
