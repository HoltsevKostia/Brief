import { expect, test, type Page } from "@playwright/test";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin";

async function fillRequiredBriefFields(page: Page) {
  const questions = page.getByTestId("public-question");
  const count = await questions.count();

  for (let i = 0; i < count; i += 1) {
    const question = questions.nth(i);
    const required = await question.getAttribute("data-required");
    if (required !== "true") continue;

    const type = await question.getAttribute("data-question-type");

    if (type === "text") {
      await question.locator('input[type="text"]').first().fill("Тест");
      continue;
    }

    if (type === "textarea") {
      await question.locator("textarea").first().fill("Тестовий опис");
      continue;
    }

    if (type === "email") {
      await question.locator('input[type="email"]').first().fill("test@example.com");
      continue;
    }

    if (type === "number") {
      await question.locator('input[type="number"]').first().fill("123");
      continue;
    }

    if (type === "singleSelect") {
      await question.locator("select").first().selectOption({ index: 1 });
      continue;
    }

    if (type === "checkbox") {
      await question.locator('input[type="checkbox"]').first().check();
      continue;
    }

    if (type === "multiSelect") {
      await question.locator('input[type="checkbox"]').first().check();
    }
  }
}

async function loginAsAdmin(page: Page) {
  await page.goto("/admin/login");
  await page.getByTestId("admin-login-username").fill(ADMIN_USERNAME);
  await page.getByTestId("admin-login-password").fill(ADMIN_PASSWORD);
  await page.getByTestId("admin-login-submit").click();
  await expect(page).toHaveURL(/\/admin\/brief$/);
}

test("A. Public brief page loads", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId("public-brief-form")).toBeVisible();
  await expect(page.getByTestId("public-question").first()).toBeVisible();
  await expect(page.getByTestId("public-submit-button")).toBeVisible();
});

test("B. Public happy-path submission", async ({ page }) => {
  await page.goto("/");
  await fillRequiredBriefFields(page);

  await page.getByTestId("public-submit-button").click();
  await expect(page).toHaveURL(/\/submitted$/);
  await expect(page.getByTestId("submitted-page")).toBeVisible();
});

test("C. Admin login happy path", async ({ page }) => {
  await loginAsAdmin(page);
  await expect(page.getByTestId("admin-brief-editor")).toBeVisible();
});

test("D. Admin brief page basic visibility", async ({ page }) => {
  await loginAsAdmin(page);

  await expect(page.getByTestId("admin-brief-settings")).toBeVisible();
  await expect(page.getByTestId("admin-questions-area")).toBeVisible();
});

test("E. Admin submissions page basic visibility", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/submissions");

  await expect(page.getByTestId("admin-submissions-page")).toBeVisible();
  await expect(page.getByTestId("admin-submissions-heading")).toBeVisible();
});

