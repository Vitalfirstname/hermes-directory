import { expect, test } from "@playwright/test";

const variants = [
  { name: "public", path: "/residents", grid: '[class*="gridTable"]' },
  { name: "admin", path: "/admin/panel", grid: ".grid-table" },
];

function makeOffices(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    tower: "A",
    number: String(index + 1).padStart(2, "0"),
    owner: `Organization ${String(count - index).padStart(2, "0")}`,
    phone: "",
    website: "",
  }));
}

async function mockPages(page, offices, { fail, cycle, truncated, overlap } = {}) {
  const requestedPages = new Set();
  await page.route("**/api/auth/me/", (route) => route.fulfill({ json: { is_staff: true } }));
  await page.route(/\/api\/offices\/(\?.*)?$/, async (route) => {
    const url = new URL(route.request().url());
    const number = Number(url.searchParams.get("page") || 1);
    requestedPages.add(number);
    expect(url.searchParams.has("page_size")).toBe(false);
    if (fail && number === 2) return route.fulfill({ status: 503 });
    const start = (number - 1) * 20;
    const results = offices.slice(start, start + 20);
    if (overlap && number === 2) results.unshift(offices[start - 1]);
    const next = cycle && number === 2
      ? "http://proxy-backend:8000/api/offices/"
      : !truncated && start + 20 < offices.length
        ? `http://proxy-backend:8000/api/offices/?page=${number + 1}`
        : null;
    return route.fulfill({ json: { count: offices.length, next, results } });
  });
  return requestedPages;
}

for (const { name, path, grid } of variants) {
  test.describe(name, () => {
    for (const count of [0, 1, 20, 21, 45]) {
      test(`loads ${count} offices across all API pages`, async ({ page }) => {
        const offices = makeOffices(count);
        const requested = await mockPages(page, offices, { overlap: count === 45 });
        await page.goto(path);
        const table = page.locator(grid);
        const owners = table.getByText(/^Organization \d+$/);
        if (name === "public") {
          await expect(table).toBeAttached();
          await expect(owners).toHaveCount(Math.min(count, 15));
          await page.getByRole("button", { name: "Все", exact: true }).click();
        } else {
          await expect(page.getByRole("button", { name: "ADD", exact: true })).toBeEnabled();
        }
        await expect(owners).toHaveCount(count);
        expect([...requested]).toEqual(
          Array.from({ length: Math.max(1, Math.ceil(count / 20)) }, (_, index) => index + 1)
        );

        if (count === 45) {
          const sortField = page.locator('select:has(option[value="owner"])');
          const sortDirection = page.locator('select:has(option[value="desc"])');
          const search = page.getByPlaceholder("башня, номер, владелец, телефон");
          const sorted = offices.map(({ owner }) => owner).reverse();
          await sortField.selectOption("owner");
          await expect(owners).toHaveText(sorted);
          await sortDirection.selectOption("desc");
          await expect(owners).toHaveText([...sorted].reverse());
          if (name === "public") {
            await page.getByRole("button", { name: "15", exact: true }).click();
          }
          await search.fill(offices.at(-1).owner);
          await expect(owners).toHaveText([offices.at(-1).owner]);
        }
      });
    }

    for (const issue of ["fail", "cycle", "truncated"]) {
      test(`rejects an incomplete list (${issue})`, async ({ page }) => {
        await mockPages(page, makeOffices(45), { [issue]: true });
        await page.goto(path);
        await expect(page.getByText("Ошибка загрузки данных")).toBeVisible();
        await expect(page.getByText(/^Organization \d+$/)).toHaveCount(0);
        if (name === "admin") {
          await expect(page.getByRole("button", { name: "ADD", exact: true })).toBeDisabled();
        }
      });
    }
  });
}

test("admin keeps the complete list current after creating, editing, and deleting", async ({ page }) => {
  const offices = makeOffices(45);
  await mockPages(page, offices);
  await page.route(/\/api\/offices\/(45\/)?$/, async (route) => {
    const request = route.request();
    if (request.method() === "GET") return route.fallback();
    if (request.method() === "DELETE") return route.fulfill({ status: 204 });
    const id = request.method() === "POST" ? 46 : 45;
    return route.fulfill({ json: { id, ...request.postDataJSON() } });
  });
  await page.goto("/admin/panel");
  const edit = page.getByRole("button", { name: "EDIT", exact: true });
  const remove = page.getByRole("button", { name: "DELETE", exact: true });
  const owner = page.getByLabel("Организация");
  const search = page.getByPlaceholder("башня, номер, владелец, телефон");
  await expect(edit).toHaveCount(45);

  await page.getByLabel("Башня").selectOption("A");
  await page.getByLabel("Кабинет").fill("46");
  await owner.fill("Created organization");
  await page.getByRole("button", { name: "ADD", exact: true }).click();
  await expect(edit).toHaveCount(46);
  await expect(page.getByText("Created organization", { exact: true })).toBeVisible();

  await search.fill(offices.at(-1).owner);
  await edit.click();
  await owner.fill("Updated organization");
  await page.getByRole("button", { name: "SAVE", exact: true }).click();
  await expect(edit).toHaveCount(0);
  await search.fill("Updated organization");
  await expect(page.getByText("Updated organization", { exact: true })).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await remove.click();
  await expect(edit).toHaveCount(0);
  await search.clear();
  await expect(edit).toHaveCount(45);
  await expect(page.getByText("Created organization", { exact: true })).toBeVisible();
  await expect(page.getByText(offices.at(-1).owner, { exact: true })).toHaveCount(0);
});
