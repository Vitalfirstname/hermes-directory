import { expect, test } from "@playwright/test";

test("public route '/' opens", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator(".login-form")).toBeVisible();
});

test("'/residents' opens and shows data", async ({ page }) => {
  await page.goto("/residents");
  await expect(page).toHaveURL(/\/residents$/);
  await expect(page.getByText("E2E Smoke Resident")).toBeVisible();
});

test("admin access, staff login, and logout flow", async ({ page }) => {
  await page.goto("/admin/panel");
  await expect(page).toHaveURL(/\/$/);

  await page.locator(".login-form input[type='text']").fill("e2e_staff");
  await page.locator(".login-form input[type='password']").fill("e2e_password_123");
  await page.locator(".login-form button.btn-login").click();

  await expect(page).toHaveURL(/\/admin\/panel$/);
  await expect(page.locator(".table__exit")).toBeVisible();

  await page.locator(".table__exit").click();
  await expect(page).toHaveURL(/\/$/);

  const sessionState = await page.evaluate(() => ({
    access: window.localStorage.getItem("access_token"),
    refresh: window.localStorage.getItem("refresh_token"),
  }));
  expect(sessionState.access).toBeNull();
  expect(sessionState.refresh).toBeNull();
});
