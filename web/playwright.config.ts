import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';
const browserChannel = process.env.PLAYWRIGHT_BROWSER_CHANNEL;

const desktopChrome: any = { ...devices['Desktop Chrome'] };
if (browserChannel) {
  // When running with Google Chrome or another channel (e.g. 'chrome', 'msedge')
  desktopChrome.channel = browserChannel;
}

export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI ? [['list'], ['html', { open: 'never' }]] : 'html',
  timeout: 45000,
  expect: {
    timeout: 10000,
  },
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
    launchOptions: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    },
  },

  projects: [
    {
      name: browserChannel ? `chrome-${browserChannel}` : 'chromium',
      use: desktopChrome,
    },
  ],

  webServer: {
    command: 'npm run dev -- --hostname 127.0.0.1 --port 3000',
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
