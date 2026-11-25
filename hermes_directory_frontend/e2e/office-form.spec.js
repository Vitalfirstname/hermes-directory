import { expect, test } from "@playwright/test";

const office = {
  id: 7,
  tower: "B",
  number: "09",
  owner: "Тестовая организация",
  phone: "+375 (17) 123-45-67",
  website: "https://example.org",
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/auth/me/", (route) => route.fulfill({ json: { is_staff: true } }));
  await page.route("**/api/offices/**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: { count: 1, next: null, previous: null, results: [office] } });
    } else {
      const id = route.request().method() === "POST" ? office.id + 1 : office.id;
      await route.fulfill({ json: { id, ...route.request().postDataJSON() } });
    }
  });
  await page.goto("/admin/panel");
});

async function paste(field, text) {
  await field.evaluate((input, value) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData("text/plain", value);
    input.dispatchEvent(new ClipboardEvent("paste", { clipboardData, bubbles: true, cancelable: true }));
  }, text);
}

test("create requires tower, cabinet, and owner and sends normalized values", async ({ page }) => {
  const requests = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/api/offices/") && request.method() === "POST") requests.push(request);
  });
  const add = page.getByRole("button", { name: "ADD", exact: true });
  await expect(page.getByLabel("Башня")).toHaveValue("");
  await expect(page.getByLabel("Башня").locator("option")).toHaveText(["TOWER", "A", "B"]);
  await expect(page.getByLabel("Код телефона").locator("option[value='']")).toHaveText("CODE");
  await add.click();
  await expect(page.getByRole("alert")).toHaveCount(3);
  expect(requests).toHaveLength(0);

  await page.getByLabel("Башня").selectOption("A");
  const number = page.getByLabel("Кабинет");
  await expect(number).toHaveAttribute("inputmode", "numeric");
  await number.pressSequentially("x019");
  await expect(number).toHaveValue("01");
  const owner = page.getByLabel("Организация");
  await paste(owner, "ООО\nExample");
  await expect(owner).toHaveValue("");
  await expect(page.getByRole("alert").filter({ hasText: "Переносы строк" })).toBeVisible();
  await owner.fill("я".repeat(101));
  await expect(owner).toHaveValue("я".repeat(101));
  await add.click();
  await expect(owner).toHaveAccessibleDescription(/100 символов без внешних пробелов/);
  expect(requests).toHaveLength(0);
  await owner.fill("  ООО «Example», Inc.  ");

  const phone = page.getByLabel("Абонентский номер");
  await page.getByLabel("Код телефона").selectOption("29");
  await phone.pressSequentially("a1234");
  await expect(phone).toHaveValue("123-4");
  const website = page.getByLabel("Веб-сайт");
  await website.fill("ftp://example.org");
  await add.click();
  await expect(page.getByRole("alert")).toHaveCount(2);
  expect(requests).toHaveLength(0);

  await paste(phone, "+375441234567");
  await expect(page.getByLabel("Код телефона")).toHaveValue("44");
  await expect(phone).toHaveValue("123-45-67");
  await website.fill("example.org/" + "x".repeat(181));
  await add.click();
  await expect(page.getByRole("alert").filter({ hasText: "200 символов" })).toBeVisible();
  expect(requests).toHaveLength(0);

  await website.fill("example.org");
  const posted = page.waitForRequest((request) => request.url().endsWith("/api/offices/") && request.method() === "POST");
  await add.click();
  expect((await posted).postDataJSON()).toEqual({
    tower: "A", number: "01", owner: "ООО «Example», Inc.",
    phone: "+375 (44) 123-45-67", website: "https://example.org",
  });
});

test("edit preserves the cabinet and can clear an existing phone", async ({ page }) => {
  await page.getByRole("button", { name: "EDIT", exact: true }).click();
  await expect(page.getByLabel("Кабинет")).toHaveValue("09");
  await expect(page.getByLabel("Код телефона")).toHaveValue("17");
  await expect(page.getByLabel("Абонентский номер")).toHaveValue("123-45-67");
  await page.getByRole("button", { name: "Очистить телефон" }).click();
  await expect(page.getByLabel("Код телефона")).toHaveValue("");
  await expect(page.getByLabel("Абонентский номер")).toHaveValue("");
  const updated = page.waitForRequest((request) => request.url().endsWith("/api/offices/7/") && request.method() === "PUT");
  await page.getByRole("button", { name: "SAVE", exact: true }).click();
  const { id: _id, ...fields } = office;
  expect((await updated).postDataJSON()).toEqual({ ...fields, phone: "" });
});

test("editing preserves 100 significant owner characters and validates the original URL", async ({ page }) => {
  await page.getByRole("button", { name: "EDIT", exact: true }).click();
  const owner = page.getByLabel("Организация");
  const website = page.getByLabel("Веб-сайт");
  const save = page.getByRole("button", { name: "SAVE", exact: true });
  const name = "я".repeat(99) + "Я";
  await owner.fill(` ${name} `);
  await expect(owner).toHaveValue(` ${name} `);
  const requests = [];
  page.on("request", (request) => {
    if (request.method() === "PUT") requests.push(request.postDataJSON());
  });
  for (const invalid of [
    "127.1", "https://0x7f.1", "https://0177.0.0.1", "https://%31%32%37.0.0.1",
    "https:///example.org", "https://example.org\\path", "example.org:",
    "example.org:0", "example.org:65536", "https://[::1]:65536",
  ]) {
    await website.fill(invalid);
    await save.click();
    await expect(website).toHaveAccessibleDescription(/корректный адрес HTTP или HTTPS/);
    expect(requests).toHaveLength(0);
  }
  await website.fill("127.0.0.1:1");
  const saved = page.waitForResponse((response) => response.request().method() === "PUT");
  await save.click();
  await saved;
  expect(requests).toHaveLength(1);
  expect(requests[0]).toMatchObject({ owner: name, website: "https://127.0.0.1:1" });

  await page.getByRole("button", { name: "EDIT", exact: true }).click();
  await website.fill("https://[::1]:65535");
  const savedAgain = page.waitForResponse((response) => response.request().method() === "PUT");
  await save.click();
  await savedAgain;
  expect(requests[1].website).toBe("https://[::1]:65535");
});

for (const method of ["POST", "PUT"]) {
  test(`${method} shows field errors, keeps the draft, and allows a corrected save`, async ({ page }) => {
    const editing = method === "PUT";
    const path = editing ? "/api/offices/7/" : "/api/offices/";
    const requests = [];
    await page.route(`**${path}`, async (route) => {
      if (route.request().method() !== method) return route.fallback();
      const payload = route.request().postDataJSON();
      requests.push(payload);
      if (requests.length > 1) return route.fulfill({ json: { id: editing ? office.id : office.id + 1, ...payload } });
      return route.fulfill({
        status: 400,
        json: {
          error: {
            code: "validation_error",
            message: "Request validation failed.",
            details: {
              tower: ["Проверьте башню."],
              number: ["Проверьте кабинет."],
              owner: ["Проверьте организацию.", "Уточните название."],
              phone: ["Проверьте телефон."],
              website: ["Проверьте сайт."],
              non_field_errors: ["Проверьте запись целиком."],
            },
          },
        },
      });
    });

    if (editing) await page.getByRole("button", { name: "EDIT", exact: true }).click();
    const tower = page.getByLabel("Башня");
    const number = page.getByLabel("Кабинет");
    const owner = page.getByLabel("Организация");
    const code = page.getByLabel("Код телефона");
    const phone = page.getByLabel("Абонентский номер");
    const website = page.getByLabel("Веб-сайт");
    const submit = page.getByRole("button", { name: editing ? "SAVE" : "ADD", exact: true });
    await tower.selectOption("A");
    await number.fill("01");
    await owner.fill("  Исходное название  ");
    await code.selectOption("29");
    await phone.fill("1234567");
    await website.fill("example.org");
    await submit.click();

    const fieldErrors = [
      [tower, "Проверьте башню."], [number, "Проверьте кабинет."],
      [owner, "Проверьте организацию."], [code, "Проверьте телефон."],
      [phone, "Проверьте телефон."], [website, "Проверьте сайт."],
    ];
    for (const [field, message] of fieldErrors) {
      await expect(field).toHaveAttribute("aria-invalid", "true");
      await expect(field).toHaveAccessibleDescription(new RegExp(message));
    }
    await expect(owner).toHaveAccessibleDescription(/Уточните название/);
    await expect(owner).toHaveCSS("border-top-color", "rgb(255, 201, 185)");
    await expect(page.getByText("Проверьте запись целиком.")).toBeVisible();
    await expect(tower).toHaveValue("A");
    await expect(number).toHaveValue("01");
    await expect(owner).toHaveValue("  Исходное название  ");
    await expect(code).toHaveValue("29");
    await expect(phone).toHaveValue("123-45-67");
    await expect(website).toHaveValue("example.org");

    await owner.fill("Исправленное название");
    await expect(owner).toHaveAttribute("aria-invalid", "false");
    await expect(number).toHaveAttribute("aria-invalid", "true");
    await code.selectOption("33");
    await expect(phone).toHaveAttribute("aria-invalid", "false");
    await submit.click();
    await expect(page.getByRole("button", { name: "ADD", exact: true })).toBeEnabled();
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(owner).toHaveValue("");
    expect(requests).toHaveLength(2);
    expect(requests[1]).toMatchObject({ owner: "Исправленное название", phone: "+375 (33) 123-45-67" });
  });
}

test("network, unavailable server, and other API failures show a general error", async ({ page }) => {
  let attempt = 0;
  await page.route("**/api/offices/", (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    attempt += 1;
    if (attempt === 1) return route.abort("failed");
    if (attempt === 2) return route.fulfill({ status: 503, body: "Unavailable" });
    return route.fulfill({
      status: 403,
      json: { error: { code: "permission_denied", message: "Сохранение запрещено." } },
    });
  });
  await page.getByLabel("Башня").selectOption("A");
  await page.getByLabel("Кабинет").fill("1");
  const owner = page.getByLabel("Организация");
  await owner.fill("Черновик");
  const add = page.getByRole("button", { name: "ADD", exact: true });
  for (const message of [/Не удалось связаться/, /Сервер не смог сохранить/, /Сохранение запрещено/]) {
    await add.click();
    await expect(page.getByRole("alert")).toHaveText(message);
    await expect(owner).toHaveValue("Черновик");
    await expect(owner).toHaveAttribute("aria-invalid", "false");
  }
});
