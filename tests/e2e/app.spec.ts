import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.clear();
  });
  await page.reload();
  await expect(page.getByRole("textbox")).toBeVisible();
});

test("supports the core writing flow", async ({ page }) => {
  const editor = page.getByRole("textbox");

  await editor.click();
  await page.keyboard.type("[ ] Capture ideas");
  await page.keyboard.press("Enter");
  await page.keyboard.type("*hoje* a noite");

  const checkbox = page.getByRole("button", {
    name: "Mark as complete",
  });
  await expect(checkbox).toBeVisible();
  await expect(page.locator(".cm-bold-text")).toHaveText("hoje");

  await checkbox.click();

  await expect(
    page.getByRole("button", { name: "Mark as pending" }),
  ).toBeVisible();
  await expect(page.locator(".cm-completed-text")).toContainText(
    "Capture ideas",
  );
});

test("reveals help from the hover header and dismisses it", async ({ page }) => {
  await page.mouse.move(8, 8);

  await expect(page.getByText("TOTLINE")).toBeVisible();
  await page.getByRole("button", { name: "Help" }).click();

  await expect(page.getByText("Keyboard Shortcuts")).toBeVisible();
  await expect(page.getByText("*text*")).toBeVisible();
  await expect(page.getByText("*line")).toBeVisible();
  await expect(page.getByText(/keeps running in the background/i)).toBeVisible();

  await page.mouse.move(8, 8);
  await expect(page.locator("header.app-header")).toHaveClass(/opacity-0/);
  await expect(page.locator("header.app-header")).toHaveClass(
    /pointer-events-none/,
  );

  await page.mouse.click(12, 120);
  await expect(page.getByText("Keyboard Shortcuts")).not.toBeVisible();
});

test("shows zoom feedback when using ctrl wheel", async ({ page }) => {
  await page.getByRole("textbox").click();

  await page.keyboard.down("Control");
  await page.mouse.wheel(0, -140);
  await page.keyboard.up("Control");

  await expect(page.getByText("105%")).toBeVisible();
});

test("resets zoom with ctrl 0", async ({ page }) => {
  await page.getByRole("textbox").click();

  await page.keyboard.down("Control");
  await page.mouse.wheel(0, -140);
  await page.keyboard.up("Control");

  await expect(page.getByText("105%")).toBeVisible();

  await page.keyboard.press("Control+0");

  await expect(page.getByText("100%")).toBeVisible();
});

test("persists writing state across reloads in web fallback mode", async ({
  page,
}) => {
  await page.getByRole("textbox").click();
  await page.keyboard.type("persistent memory surface");

  await expect(page.locator(".cm-line")).toContainText(
    "persistent memory surface",
  );
  await page.waitForTimeout(700);

  await page.reload();

  await expect(page.getByRole("textbox")).toBeVisible();
  await expect(page.locator(".cm-line")).toContainText(
    "persistent memory surface",
  );
});
