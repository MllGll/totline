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

  await page.keyboard.press("Control+/");
  const panel = page.locator(".help-panel");
  await expect(panel).toBeVisible();

  const panelStyles = await panel.evaluate((element) => {
    const computed = window.getComputedStyle(element);
    return {
      background: computed.background,
      borderColor: computed.borderColor,
    };
  });

  expect(styles.background).toContain("linear-gradient");
  expect(panelStyles.background).toContain("linear-gradient");
  expect(styles.background).toContain("rgba(196, 207, 222, 0.13)");
  expect(panelStyles.background).toContain("rgba(196, 207, 222, 0.13)");
  expect(styles.background).toContain("rgba(116, 138, 166, 0.08)");
  expect(panelStyles.background).toContain("rgba(116, 138, 166, 0.08)");
  expect(styles.borderColor).toBe(panelStyles.borderColor);
  expect(styles.backdropFilter).toContain("blur");
  expect(styles.borderColor).not.toBe("rgba(0, 0, 0, 0)");
  expect(styles.boxShadow).not.toBe("none");
});

test("keeps the hover header lightweight and aligned", async ({ page }) => {
  const header = page.locator("header.app-header");

  await expect(header).toHaveClass(/opacity-0/);
  await page.mouse.move(8, 8);

  await expect(header).toHaveClass(/opacity-100/);
  await expect(page.locator(".app-title-icon")).toBeVisible();
  await expect(page.getByText("TOTLINE")).toBeVisible();
  await expect(page.getByRole("button", { name: "Always on top" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Help" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Minimize" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Close to background" }),
  ).toBeVisible();

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

  const iconBox = await page.locator(".app-title-icon").boundingBox();
  expect(iconBox?.width).toBeCloseTo(20);
  expect(iconBox?.height).toBeCloseTo(20);
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
  const key = page.locator("kbd").filter({ hasText: "Ctrl" }).first();
  await expect(panel).toBeVisible();
  await expect(key).toBeVisible();

  const styles = await panel.evaluate((element) => {
    const computed = window.getComputedStyle(element);
    return {
      borderColor: computed.borderColor,
      outlineColor: computed.outlineColor,
      outlineStyle: computed.outlineStyle,
      outlineWidth: computed.outlineWidth,
    };
  });

  const keyStyles = await key.evaluate((element) => {
    const computed = window.getComputedStyle(element);
    return {
      fontFamily: computed.fontFamily,
      fontWeight: computed.fontWeight,
    };
  });

  expect(styles.outlineWidth).toBe("0px");
  expect(styles.outlineStyle).not.toBe("auto");
  expect(styles.borderColor).not.toBe("rgb(255, 255, 255)");
  expect(styles.outlineColor).not.toBe("rgb(255, 255, 255)");
  expect(keyStyles.fontFamily).toContain("JetBrains Mono");
  expect(keyStyles.fontWeight).toBe("100");
});

test("keeps editor focus visually borderless", async ({ page }) => {
  await page.getByRole("textbox").click();

  const styles = await page.locator(".cm-editor").evaluate((element) => {
    const editor = window.getComputedStyle(element);
    const content = window.getComputedStyle(
      element.querySelector(".cm-content") as Element,
    );

    return {
      contentBorderTopWidth: content.borderTopWidth,
      contentOutlineColor: content.outlineColor,
      contentOutlineStyle: content.outlineStyle,
      contentOutlineWidth: content.outlineWidth,
      editorBorderTopWidth: editor.borderTopWidth,
      editorOutlineColor: editor.outlineColor,
      editorOutlineStyle: editor.outlineStyle,
      editorOutlineWidth: editor.outlineWidth,
    };
  });

  expect(styles.editorOutlineWidth).toBe("0px");
  expect(styles.editorOutlineColor).toBe("rgba(0, 0, 0, 0)");
  expect(styles.editorBorderTopWidth).toBe("0px");
  expect(styles.contentOutlineWidth).toBe("0px");
  expect(styles.contentOutlineColor).toBe("rgba(0, 0, 0, 0)");
  expect(styles.contentBorderTopWidth).toBe("0px");
});

test("keeps the editor scrollbar smooth and minimal", async ({ page }) => {
  await page.getByRole("textbox").click();
  await page.keyboard.insertText(
    Array.from({ length: 80 }, (_, index) => `line ${index + 1}`).join("\n"),
  );

  const scroller = page.locator(".cm-scroller");
  const customScrollbar = page.locator(".editor-scrollbar");
  const customThumb = page.locator(".editor-scrollbar-thumb");
  await expect(scroller).toBeVisible();
  await expect(customScrollbar).toBeVisible();
  await expect(customThumb).toBeVisible();

  const styles = await scroller.evaluate((element) => {
    const scrollerStyles = window.getComputedStyle(element);
    const scrollbar = window.getComputedStyle(
      element,
      "::-webkit-scrollbar",
    );
    const button = window.getComputedStyle(
      element,
      "::-webkit-scrollbar-button",
    );
    const thumb = window.getComputedStyle(
      element,
      "::-webkit-scrollbar-thumb",
    );
    const track = window.getComputedStyle(
      element,
      "::-webkit-scrollbar-track",
    );

    return {
      overscrollBehavior: scrollerStyles.overscrollBehavior,
      scrollBehavior: scrollerStyles.scrollBehavior,
      scrollbarColor: scrollerStyles.scrollbarColor,
      scrollbarStyleWidth: scrollerStyles.scrollbarWidth,
      scrollbarDisplay: scrollbar.display,
      scrollbarWidth: scrollbar.width,
      buttonDisplay: button.display,
      buttonHeight: button.height,
      nativeThumbDisplay: thumb.display,
      trackBackground: track.backgroundColor,
    };
  });

  const customStyles = await customThumb.evaluate((element) => {
    const thumb = window.getComputedStyle(element);
    const rail = window.getComputedStyle(element.parentElement as Element);
    const root = window.getComputedStyle(document.documentElement);

    return {
      background: thumb.backgroundImage,
      borderRadius: thumb.borderRadius,
      expectedInset: root.getPropertyValue("--editor-scrollbar-inset").trim(),
      expectedOffset: root.getPropertyValue("--editor-scrollbar-offset").trim(),
      expectedSize: root.getPropertyValue("--editor-scrollbar-size").trim(),
      left: thumb.left,
      minHeight: thumb.minHeight,
      opacity: thumb.opacity,
      railRight: rail.right,
      railWidth: rail.width,
      transitionDuration: thumb.transitionDuration,
      transitionProperty: thumb.transitionProperty,
      transitionTimingFunction: thumb.transitionTimingFunction,
    };
  });

  expect(styles.scrollBehavior).toBe("smooth");
  expect(styles.overscrollBehavior).toBe("contain");
  expect(styles.scrollbarColor).toContain("rgba(0, 0, 0, 0)");
  expect(styles.scrollbarStyleWidth).toBe("none");
  expect(styles.scrollbarDisplay).toBe("none");
  expect(styles.scrollbarWidth).toBe("0px");
  expect(styles.buttonDisplay).toBe("none");
  expect(styles.buttonHeight).toBe("0px");
  expect(styles.nativeThumbDisplay).toBe("block");
  expect(styles.trackBackground).toBe("rgba(0, 0, 0, 0)");
  expect(customStyles.background).toContain("linear-gradient");
  expect(customStyles.borderRadius).toBe("999px");
  expect(customStyles.left).toBe(customStyles.expectedInset);
  expect(customStyles.minHeight).toBe("36px");
  expect(customStyles.railRight).toBe(customStyles.expectedOffset);
  expect(customStyles.railWidth).toBe(customStyles.expectedSize);
  expect(customStyles.transitionProperty).toContain("opacity");
  expect(customStyles.transitionDuration).not.toContain("0s");
  expect(customStyles.transitionTimingFunction).toContain(
    "cubic-bezier(0.22, 1, 0.36, 1)",
  );

  await scroller.evaluate((element) => {
    element.scrollTop = 0;
  });
  await page.evaluate(() => {
    window.dispatchEvent(new Event("focus"));
  });

  await expect
    .poll(
      async () =>
        customThumb.evaluate((element) =>
          Number(window.getComputedStyle(element).opacity),
        ),
      { timeout: 7000 },
    )
    .toBeLessThanOrEqual(0.52);

  const idleOpacity = await customThumb.evaluate((element) =>
    Number(window.getComputedStyle(element).opacity),
  );

  await page.mouse.move(8, 8);
  await expect
    .poll(
      async () =>
        customThumb.evaluate((element) =>
          Number(window.getComputedStyle(element).opacity),
        ),
      { timeout: 7000 },
    )
    .toBeLessThanOrEqual(0.52);

  const hoverOpacity = await customThumb.evaluate((element) =>
    Number(window.getComputedStyle(element).opacity),
  );

  await scroller.evaluate((element) => {
    element.scrollTop += 260;
    element.dispatchEvent(new Event("scroll", { bubbles: true }));
  });

  await expect
    .poll(async () =>
      customThumb.evaluate((element) =>
        Number(window.getComputedStyle(element).opacity),
      ),
    )
    .toBeGreaterThan(0.75);

  const activeOpacity = await customThumb.evaluate((element) =>
    Number(window.getComputedStyle(element).opacity),
  );

  await page.evaluate(() => {
    window.dispatchEvent(new Event("blur"));
  });

  await expect
    .poll(
      async () =>
        customThumb.evaluate((element) =>
          Number(window.getComputedStyle(element).opacity),
        ),
      { timeout: 7000 },
    )
    .toBeLessThanOrEqual(0.02);

  expect(idleOpacity).toBeLessThanOrEqual(0.52);
  expect(hoverOpacity).toBeLessThanOrEqual(0.52);
  expect(activeOpacity).toBeGreaterThanOrEqual(0.75);
});

test("fades editor text edges only when more text exists", async ({
  page,
}) => {
  await page.getByRole("textbox").click();
  await page.keyboard.insertText(
    Array.from({ length: 80 }, (_, index) => `line ${index + 1}`).join("\n"),
  );

  const host = page.locator(".cm-editor-host");
  const scroller = page.locator(".cm-scroller");
  await expect(page.locator(".editor-scroll-edge")).toHaveCount(0);

  await scroller.evaluate((element) => {
    element.scrollTop = 0;
    element.dispatchEvent(new Event("scroll", { bubbles: true }));
  });

  await expect(host).not.toHaveClass(/cm-editor-host-top-fade/);
  await expect(host).toHaveClass(/cm-editor-host-bottom-fade/);

  await scroller.evaluate((element) => {
    element.scrollTop = 260;
    element.dispatchEvent(new Event("scroll", { bubbles: true }));
  });

  await expect(host).toHaveClass(/cm-editor-host-top-fade/);
  await expect(host).toHaveClass(/cm-editor-host-bottom-fade/);

  await expect
    .poll(async () =>
      scroller.evaluate((element) =>
        Number(
          window
            .getComputedStyle(element)
            .getPropertyValue("--editor-top-mask-opacity"),
        ),
      ),
    )
    .toBeLessThanOrEqual(0.02);

  await expect
    .poll(async () =>
      scroller.evaluate((element) =>
        Number(
          window
            .getComputedStyle(element)
            .getPropertyValue("--editor-bottom-mask-opacity"),
        ),
      ),
    )
    .toBeLessThanOrEqual(0.02);

  const middleMask = await scroller.evaluate((element) => {
    const computed = window.getComputedStyle(element);
    return {
      bottomMaskOpacity: computed.getPropertyValue(
        "--editor-bottom-mask-opacity",
      ),
      maskImage: computed.maskImage || computed.webkitMaskImage,
      topMaskOpacity: computed.getPropertyValue("--editor-top-mask-opacity"),
      transitionProperty: computed.transitionProperty,
    };
  });

  expect(middleMask.maskImage).toContain("linear-gradient");
  expect(Number(middleMask.topMaskOpacity)).toBeLessThanOrEqual(0.02);
  expect(Number(middleMask.bottomMaskOpacity)).toBeLessThanOrEqual(0.02);
  expect(middleMask.transitionProperty).toContain(
    "--editor-top-mask-opacity",
  );
  expect(middleMask.transitionProperty).toContain(
    "--editor-bottom-mask-opacity",
  );

  await scroller.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
    element.dispatchEvent(new Event("scroll", { bubbles: true }));
  });

  await expect(host).toHaveClass(/cm-editor-host-top-fade/);
  await expect(host).not.toHaveClass(/cm-editor-host-bottom-fade/);
});

test("keeps the zoom HUD centered during its animation", async ({ page }) => {
  await page.getByRole("textbox").click();

  await page.keyboard.down("Control");
  await page.mouse.wheel(0, -140);
  await page.keyboard.up("Control");

  const hud = page.locator(".zoom-hud");
  await expect(hud).toBeVisible();

  const box = await hud.boundingBox();
  const viewport = page.viewportSize();

  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();

  const hudCenterX = box!.x + box!.width / 2;
  const viewportCenterX = viewport!.width / 2;

  expect(Math.abs(hudCenterX - viewportCenterX)).toBeLessThan(2);

  const transform = await hud.evaluate(
    (element) => window.getComputedStyle(element).transform,
  );

  expect(transform).not.toBe("none");
});

test("keeps the zoom HUD visible when zoom activity is renewed", async ({
  page,
}) => {
  await page.getByRole("textbox").click();

  await page.keyboard.down("Control");
  await page.mouse.wheel(0, -140);
  await page.waitForTimeout(200);
  await page.mouse.wheel(0, -140);
  await page.keyboard.up("Control");

  const hud = page.locator(".zoom-hud");
  await expect(hud).toBeVisible();
  await expect(hud).toContainText("110%");
  await expect(hud).toHaveClass(/zoom-hud-visible/);

  await expect
    .poll(async () =>
      hud.evaluate((element) =>
        Number.parseFloat(window.getComputedStyle(element).opacity),
      ),
    )
    .toBeGreaterThan(0.5);
});

test("keeps the zoom HUD consistent with the help panel glass style", async ({
  page,
}) => {
  await page.getByRole("textbox").click();

  await page.keyboard.press("Control+/");
  const panel = page.locator(".help-panel");
  await expect(panel).toBeVisible();

  const panelStyles = await panel.evaluate((element) => {
    const computed = window.getComputedStyle(element);
    return {
      background: computed.background,
      borderColor: computed.borderColor,
    };
  });

  await page.keyboard.press("Control+/");

  await page.keyboard.down("Control");
  await page.mouse.wheel(0, -140);
  await page.keyboard.up("Control");

  const hud = page.locator(".zoom-hud");
  await expect(hud).toBeVisible();

  const hudStyles = await hud.evaluate((element) => {
    const computed = window.getComputedStyle(element);
    return {
      background: computed.background,
      borderColor: computed.borderColor,
      borderRadius: computed.borderRadius,
      color: computed.color,
    };
  });

  expect(hudStyles.background).toBe(panelStyles.background);
  expect(hudStyles.borderColor).toBe(panelStyles.borderColor);
  expect(hudStyles.borderRadius).toBe("6px");
  expect(hudStyles.color).not.toBe("rgba(0, 0, 0, 0)");
});
