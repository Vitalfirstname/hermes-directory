import { defineConfig } from "@playwright/test";

const reuseExistingServer = !process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  webServer: [
    {
      command:
        "python manage.py migrate && python manage.py shell -c \"exec(open('scripts/seed_e2e_smoke.py', encoding='utf-8').read())\" && python manage.py runserver 127.0.0.1:8000",
      cwd: "../hermes_directory_backend",
      url: "http://127.0.0.1:8000/api/offices/",
      timeout: 120_000,
      reuseExistingServer,
    },
    {
      command: "npm run dev -- --host 127.0.0.1 --port 5173",
      cwd: ".",
      url: "http://127.0.0.1:5173/",
      timeout: 120_000,
      reuseExistingServer,
    },
  ],
});
