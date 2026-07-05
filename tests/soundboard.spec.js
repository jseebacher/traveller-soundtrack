const { test, expect } = require("@playwright/test");

test("blaster fx button plays and clears from the playing list", async ({ page }) => {
  test.setTimeout(45000); // the blaster fx clip itself is 30s long, so the default 30s test timeout isn't enough
  const consoleMsgs = [];
  page.on("console", (msg) => consoleMsgs.push(`[${msg.type()}] ${msg.text()}`));
  page.on("pageerror", (err) => consoleMsgs.push(`[pageerror] ${err.message}`));

  await page.goto("/");
  await page.waitForSelector('#soundboard button[data-fx-id="480872-c3sabertooth-blaster-multiple"]');
  await expect(page.locator("#attribution")).not.toContainText("loading audio library", { timeout: 20000 });

  const btn = page.locator('#soundboard button[data-fx-id="480872-c3sabertooth-blaster-multiple"]');
  await btn.click();

  // did it even register as playing?
  await expect(page.locator("#attribution"), "blaster never appeared in the playing list").toContainText(
    "blaster",
    { timeout: 2000 }
  );
  console.log("appeared in playing list");

  await expect(page.locator("#attribution"), "blaster never cleared from the playing list").not.toContainText(
    "blaster",
    { timeout: 35000 }
  );

  console.log("--- console log ---\n" + consoleMsgs.join("\n"));
});
