import { test, expect } from "@playwright/test";

test.describe("Practice Flow", () => {
  test("Practice page loads and shows templates", async ({ page }) => {
    await page.goto("/practice");
    await expect(page.getByTestId("practice-page")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Practice Mode" })
    ).toBeVisible();

    // At least one practice template card is visible
    const cards = page.getByTestId("practice-template-card");
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThanOrEqual(3);
  });

  test("Full practice session flow", async ({ page }) => {
    // Step 1: Navigate to practice page
    await page.goto("/practice");
    await expect(page.getByTestId("practice-page")).toBeVisible();

    // Step 2: Click the first practice template (Basic Voice Clone Pipeline)
    await page.getByTestId("practice-template-card").first().click();

    // Step 3: Verify practice session view loads
    await expect(page.getByTestId("practice-session-view")).toBeVisible();
    await expect(page.getByTestId("start-session-button")).toBeVisible();

    // Step 4: Start the session
    await page.getByTestId("start-session-button").click();

    // Step 5: Wait for the session to start and phase stepper to appear
    await expect(page.getByTestId("phase-stepper")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByTestId("current-phase")).toBeVisible();

    // Step 6: Navigate through phases
    await page.getByTestId("next-phase-button").click();
    // Verify we moved to phase 2
    await expect(page.getByTestId("current-phase")).toBeVisible();

    // Step 7: Self-score using rubric sliders
    await expect(page.getByTestId("rubric-section")).toBeVisible();
    const firstSlider = page
      .getByTestId("rubric-slider-requirements");
    await firstSlider.fill("4");

    // Step 8: Add notes
    await page.getByTestId("session-notes").fill("Test practice session notes");

    // Step 9: Finish the session
    await page.getByTestId("finish-session-button").click();

    // Step 10: Verify completion screen
    await expect(page.getByTestId("session-completed")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("Session Complete!")).toBeVisible();
    // The total score should be displayed
    await expect(page.getByText("Score Breakdown")).toBeVisible();
  });

  test("Sidebar navigation to practice works", async ({ page }) => {
    await page.goto("/");
    await page
      .getByTestId("sidebar")
      .getByRole("link", { name: /Practice/i })
      .click();
    await expect(page.getByTestId("practice-page")).toBeVisible();
  });
});
