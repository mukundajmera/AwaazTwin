import { test, expect } from "@playwright/test";

test.describe("UAT Scenarios", () => {
  test("Scenario A: Browse classic content", async ({ page }) => {
    // Step 1: Open the portal home page
    await page.goto("/");
    await expect(page.getByTestId("home-page")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Welcome to AwaazTwin" })
    ).toBeVisible();

    // Step 2: Section cards are displayed
    const sectionCards = page.locator(
      '[data-testid="home-page"] a[href^="/topics/"]'
    );
    await expect(sectionCards.first()).toBeVisible();
    expect(await sectionCards.count()).toBeGreaterThanOrEqual(3);

    // Step 3: Navigate to Voice Cloning section
    await page
      .getByTestId("sidebar")
      .getByRole("link", { name: /Voice Cloning/i })
      .click();
    await expect(page.getByTestId("section-page")).toBeVisible();

    // Step 4: At least one topic card
    const topicCards = page.getByTestId("topic-card");
    await expect(topicCards.first()).toBeVisible();
    expect(await topicCards.count()).toBeGreaterThanOrEqual(1);

    // Step 5: Open a topic and verify content
    await topicCards.first().click();
    await expect(page.getByTestId("topic-page")).toBeVisible();
    await expect(page.getByTestId("topic-content")).toBeVisible();
    const content = page.getByTestId("topic-content");
    await expect(content).not.toBeEmpty();

    // Step 6: Breadcrumb navigation present
    await expect(page.getByTestId("breadcrumb")).toBeVisible();
  });

  test("Scenario B: Configure LLM and test connection", async ({ page }) => {
    // Step 1: Navigate to Settings
    await page.goto("/settings");
    await expect(page.getByTestId("settings-page")).toBeVisible();

    // Step 2: LLM settings section visible
    await expect(page.getByTestId("llm-settings")).toBeVisible();

    // Step 3: Select provider (Ollama is default)
    const providerSelect = page.getByTestId("llm-provider");
    await expect(providerSelect).toHaveValue("ollama");

    // Step 4: Fill in base URL and model
    await page.getByTestId("llm-base-url").fill("http://localhost:11434");
    await page.getByTestId("llm-model").fill("llama3.2");

    // Step 5: Click Test Connection
    await page.getByTestId("llm-test-connection").click();

    // Step 6: Verify status shows either success or a clear error (not a crash)
    const status = page.getByTestId("llm-connection-status");
    // The real endpoint tries to connect; if no LLM is running we expect an error message
    await expect(status).toContainText(/Connected|error|failed|fetch/i, {
      timeout: 35000,
    });
  });

  test("Scenario C: Configure TTS and test connection", async ({ page }) => {
    // Step 1: Navigate to Settings
    await page.goto("/settings");
    await expect(page.getByTestId("settings-page")).toBeVisible();

    // Step 2: TTS settings section visible
    await expect(page.getByTestId("tts-settings")).toBeVisible();

    // Step 3: Enable TTS
    await page.getByTestId("tts-enabled").check();

    // Step 4: Enter TTS server URL
    await page.getByTestId("tts-server-url").fill("http://localhost:5002");

    // Step 5: Click Test Connection
    await page.getByTestId("tts-test-connection").click();

    // Step 6: Verify status (connected or clear error)
    const status = page.getByTestId("tts-connection-status");
    await expect(status).toContainText(/Connected|error|failed|fetch/i, {
      timeout: 20000,
    });
  });

  test("Scenario D: Full practice session", async ({ page }) => {
    // Step 1: Navigate to Practice page
    await page.goto("/practice");
    await expect(page.getByTestId("practice-page")).toBeVisible();

    // Step 2: Select first practice template
    const cards = page.getByTestId("practice-template-card");
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThanOrEqual(1);
    await cards.first().click();

    // Step 3: Practice session view loads
    await expect(page.getByTestId("practice-session-view")).toBeVisible();
    await expect(page.getByTestId("start-session-button")).toBeVisible();

    // Step 4: Start session
    await page.getByTestId("start-session-button").click();
    await expect(page.getByTestId("phase-stepper")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByTestId("current-phase")).toBeVisible();

    // Step 5: Navigate through at least two phases
    await page.getByTestId("next-phase-button").click();
    await expect(page.getByTestId("current-phase")).toBeVisible();

    // Step 6: Fill rubric score
    await expect(page.getByTestId("rubric-section")).toBeVisible();
    const slider = page.getByTestId("rubric-slider-requirements");
    await slider.fill("4");

    // Step 7: Add notes
    await page.getByTestId("session-notes").fill("UAT test session notes");

    // Step 8: Finish session
    await page.getByTestId("finish-session-button").click();

    // Step 9: Verify completion screen
    await expect(page.getByTestId("session-completed")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("Session Complete!")).toBeVisible();
    await expect(page.getByText("Score Breakdown")).toBeVisible();
  });

  test("UAT Checklist page loads", async ({ page }) => {
    await page.goto("/uat");
    await expect(page.getByTestId("uat-checklist-page")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "UAT Checklist" })
    ).toBeVisible();

    // At least 4 scenario cards
    const scenarioCards = page.getByTestId("uat-scenario");
    await expect(scenarioCards.first()).toBeVisible();
    expect(await scenarioCards.count()).toBeGreaterThanOrEqual(4);

    // Summary section
    await expect(page.getByTestId("uat-summary")).toBeVisible();
  });
});
