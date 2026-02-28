import { test, expect } from "@playwright/test";

test.describe("Portal Smoke Tests", () => {
  test("Home page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("home-page")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Welcome to AwaazTwin" })).toBeVisible();

    // At least one section card is visible
    const cards = page.locator('[data-testid="home-page"] a[href^="/topics/"]');
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThanOrEqual(1);

    // Sidebar navigation is present
    await expect(page.getByTestId("sidebar")).toBeVisible();
  });

  test("Navigation works", async ({ page }) => {
    await page.goto("/");

    // Click Voice Cloning in sidebar
    await page.getByTestId("sidebar").getByRole("link", { name: /Voice Cloning/i }).click();

    // Verify section page
    await expect(page.getByTestId("section-page")).toBeVisible();

    // At least one topic card is visible
    const topicCards = page.getByTestId("topic-card");
    await expect(topicCards.first()).toBeVisible();
    expect(await topicCards.count()).toBeGreaterThanOrEqual(1);
  });

  test("Topic page renders content", async ({ page }) => {
    await page.goto("/topics/voice-cloning");
    await expect(page.getByTestId("section-page")).toBeVisible();

    // Click the first topic card
    await page.getByTestId("topic-card").first().click();

    // Verify topic page elements
    await expect(page.getByTestId("topic-page")).toBeVisible();
    await expect(page.getByTestId("topic-content")).toBeVisible();
    await expect(page.getByTestId("breadcrumb")).toBeVisible();

    // Content should have rendered text
    const content = page.getByTestId("topic-content");
    await expect(content).not.toBeEmpty();
  });

  test("Settings page loads and LLM test connection works", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByTestId("settings-page")).toBeVisible();
    await expect(page.getByTestId("llm-settings")).toBeVisible();
    await expect(page.getByTestId("tts-settings")).toBeVisible();

    // Fill in LLM base URL and model
    await page.getByTestId("llm-base-url").fill("http://localhost:11434");
    await page.getByTestId("llm-model").fill("llama3.2");

    // Click Test Connection
    await page.getByTestId("llm-test-connection").click();

    // Wait for status – accepts success (Connected) or a clear error message (not a crash)
    const status = page.getByTestId("llm-connection-status");
    await expect(status).toContainText(/Connected|error|failed|refused|fetch/i, { timeout: 35000 });
  });

  test("Test Console page loads and shows suites", async ({ page }) => {
    await page.goto("/tests");
    await expect(page.getByTestId("test-console-page")).toBeVisible();

    // At least one test suite card is present
    const suiteCards = page.getByTestId("test-suite-card");
    await expect(suiteCards.first()).toBeVisible();
    expect(await suiteCards.count()).toBeGreaterThanOrEqual(1);

    // Click the first Run button
    await suiteCards.first().getByTestId("run-test-button").click();

    // Verify test results appear with completed status
    const results = suiteCards.first().getByTestId("test-results");
    await expect(results).toBeVisible({ timeout: 10000 });
    await expect(results).toContainText(/passed|completed/i);
  });
});
