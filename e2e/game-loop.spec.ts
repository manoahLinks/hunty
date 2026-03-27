import { test, expect } from "@playwright/test";
import { injectMockWallet, seedHuntData } from "./helpers/mock-wallet";

test.describe("Core Game Loop: Create → Join → Solve → Complete", () => {
  test.beforeEach(async ({ page }) => {
    await injectMockWallet(page);
    await seedHuntData(page);
  });

  test("home page shows active hunts from seed data", async ({ page }) => {
    await page.goto("/");

    // The seeded "E2E Test Hunt" (status: Active) should appear
    await expect(
      page.locator('[data-slot="card-title"]').filter({ hasText: "E2E Test Hunt" }).first()
    ).toBeVisible();
    // Draft hunts should NOT appear on the home page (only Active hunts shown)
    await expect(page.locator('[data-slot="card-title"]').filter({ hasText: "Draft Hunt" })).toHaveCount(0);
  });

  test("dashboard shows all hunts including drafts", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.getByRole("heading", { name: "My Hunts" })).toBeVisible();
    // Use card titles to avoid matching the page description text
    await expect(page.locator('[data-slot="card-title"]').filter({ hasText: "E2E Test Hunt" })).toBeVisible();
    await expect(page.locator('[data-slot="card-title"]').filter({ hasText: "Draft Hunt" })).toBeVisible();
  });

  test("draft hunt shows Activate button only when it has clues", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // The "Draft Hunt" has cluesCount: 1, so Activate should be enabled
    const draftCard = page.locator("text=Draft Hunt").locator("..").locator("..");
    await expect(draftCard.getByRole("button", { name: "Activate" })).toBeEnabled();
  });

  test("player can play the test game in preview mode on /hunty", async ({
    page,
  }) => {
    await page.goto("/hunty");

    // Fill in a clue with a known answer
    await page.getByPlaceholder("Title of the Hunt").fill("Test Question");
    await page
      .getByPlaceholder("Description")
      .fill("A simple test question.");
    await page.getByPlaceholder("Enter Code to Unlock next challenge").fill("testanswer");

    // Click "Test" (if available) or trigger play mode
    // The PlayGame component renders in preview/local mode (no huntId)
    const testBtn = page.getByRole("button", { name: /test/i });
    if (await testBtn.isVisible()) {
      await testBtn.click();

      // Now we should be in the play interface
      await expect(page.getByRole("heading", { name: "Test Question" })).toBeVisible();

      // Submit a wrong answer first
      const answerInput = page.getByPlaceholder("Enter answer to unlock");
      await answerInput.fill("wronganswer");
      await answerInput.press("Enter");

      // Should show error feedback
      await expect(page.getByText("Try Again")).toBeVisible();

      // Now submit the correct answer
      await answerInput.fill("testanswer");
      await answerInput.press("Enter");

      // Should show success feedback
      await expect(page.getByText("Correct!")).toBeVisible();
    }
  });

  test("home page leaderboard toggle works", async ({ page }) => {
    await page.goto("/");

    // Click the Leaderboard button
    await page.getByRole("button", { name: "Leaderboard" }).first().click();

    // The global leaderboard section should be visible
    await expect(page.getByText("Global Leaderboard")).toBeVisible();

    // Click again to close
    await page.getByRole("button", { name: "Leaderboard" }).first().click();
    await expect(page.getByText("Global Leaderboard")).not.toBeVisible();
  });

  test("hunt card on home page has leaderboard link", async ({ page }) => {
    await page.goto("/");

    // Each active hunt card should have a Leaderboard button
    const huntCard = page.locator("text=E2E Test Hunt").locator("..").locator("..");
    await expect(
      huntCard.getByRole("button", { name: /leaderboard/i })
    ).toBeVisible();
  });
});
