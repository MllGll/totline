import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.clear();
  });
  await page.reload();
  await expect(page.getByRole("textbox")).toBeVisible();
});

test("keeps the liquid glass shell visually configured", async ({ page }) => {
  const shell = page.locator(".app-glass");

  await expect(shell).toBeVisible();
  await expect(shell).toHaveCSS("border-radius", "20px");
  await expect(shell).toHaveCSS("overflow", "hidden");

  const styles = await shell.evaluate((element) => {
    const computed = window.getComputedStyle(element);
    return {
      background: computed.background,
      backdropFilter: computed.backdropFilter || computed.webkitBackdropFilter,
      borderColor: computed.borderColor,
      boxShadow: computed.boxShadow,
    };
  });

  expect(styles.background).toContain("rgba(0, 1, 3");
  expect(styles.backdropFilter).toContain("blur");
  expect(styles.borderColor).not.toBe("rgba(0, 0, 0, 0)");
  expect(styles.boxShadow).not.toBe("none");
});

test("keeps the hover header lightweight and aligned", async ({ page }) => {
  const header = page.locator("header.app-header");

  await expect(header).toHaveClass(/opacity-0/);
  await page.mouse.move(8, 8);

  await expect(header).toHaveClass(/opacity-100/);
  await expect(page.getByText("TOTLINE")).toBeVisible();
  await expect(page.getByRole("button", { name: "Always on top" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Help" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Minimize" })).toBeVisible();

  await expect
    .poll(async () => {
      const box = await header.boundingBox();
      return Math.abs(box?.y ?? 999);
    })
    .toBeLessThan(2);

  const box = await header.boundingBox();
  expect(Math.abs(box?.y ?? 999)).toBeLessThan(2);
  expect(box?.height).toBeGreaterThanOrEqual(40);
  expect(box?.height).toBeLessThanOrEqual(48);
});

test("centers the help panel above the editor", async ({ page }) => {
  await page.mouse.move(8, 8);
  await page.getByRole("button", { name: "Help" }).click();

  const panel = page.locator(".help-panel");
  await expect(panel).toBeVisible();

  const panelBox = await panel.boundingBox();
  const viewport = page.viewportSize();

  expect(panelBox).not.toBeNull();
  expect(viewport).not.toBeNull();

  const panelCenterX = panelBox!.x + panelBox!.width / 2;
  const panelCenterY = panelBox!.y + panelBox!.height / 2;
  const viewportCenterX = viewport!.width / 2;
  const viewportCenterY = viewport!.height / 2;

  expect(Math.abs(panelCenterX - viewportCenterX)).toBeLessThan(2);
  expect(Math.abs(panelCenterY - viewportCenterY)).toBeLessThan(2);
  await expect(page.getByText("Keyboard Shortcuts")).toBeVisible();
});

test("keeps help panel focus styling inside the app palette", async ({
  page,
}) => {
  await page.getByRole("textbox").click();
  await page.keyboard.press("Control+/");

  const panel = page.locator(".help-panel");
  await expect(panel).toBeVisible();

  const styles = await panel.evaluate((element) => {
    const computed = window.getComputedStyle(element);
    return {
      borderColor: computed.borderColor,
      outlineColor: computed.outlineColor,
      outlineStyle: computed.outlineStyle,
      outlineWidth: computed.outlineWidth,
    };
  });

  expect(styles.outlineWidth).toBe("0px");
  expect(styles.outlineStyle).not.toBe("auto");
  expect(styles.borderColor).not.toBe("rgb(255, 255, 255)");
  expect(styles.outlineColor).not.toBe("rgb(255, 255, 255)");
});
