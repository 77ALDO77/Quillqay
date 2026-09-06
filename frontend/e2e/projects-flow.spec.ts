import { test, expect } from '@playwright/test';

test.describe('Projects, Notes, Kanban and Diagrams Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate before each test
    await page.goto('/login');
    await page.getByPlaceholder('Email address').fill('admin@quillqay.local');
    await page.getByPlaceholder('Password').fill('change-this-development-password');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await page.waitForURL('**/projects');
  });

  test('should create a new project and navigate inside it', async ({ page }) => {
    const projectName = `E2E Test ${Date.now()}`;

    // Click on "New Project" button
    const newProjectBtn = page.getByRole('button', { name: /New Project/i }).first();
    await newProjectBtn.click();

    // Fill project form modal
    await page.getByPlaceholder('Project name *').fill(projectName);
    await page.getByPlaceholder('Description (optional)').fill('Created by Playwright automated test');
    
    // Submit creation
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    // Verify project appears in the list
    const card = page.locator('.glass-panel', { hasText: projectName });
    await expect(card).toBeVisible({ timeout: 10000 });

    // Click "Open" link in the card
    await card.getByRole('link', { name: /Open/i }).click();

    // Should navigate to project notes section by default
    await page.waitForURL(/.*\/projects\/[a-f0-9-]+\/notes/);
    await expect(page.getByText(/Live/i)).toBeVisible(); // Realtime WebSocket indicator
  });

  test('should navigate to diagrams and open the AntV X6 schema designer', async ({ page }) => {
    // Open the first available project
    const openLink = page.getByRole('link', { name: /Open/i }).first();
    await openLink.click();

    await page.waitForURL(/.*\/projects\/[a-f0-9-]+/);

    // Navigate to Diagrams tab
    const diagramsLink = page.locator('aside nav a[href*="/diagrams"]');
    await diagramsLink.click();
    await page.waitForURL(/.*\/projects\/[a-f0-9-]+\/diagrams/);

    // Verify Diagrams Hub loaded
    await expect(page.getByText(/Database Schema/i).first()).toBeVisible();

    // Open the Database Schema Designer
    const dbCard = page.locator('a[href*="/diagrams/db"]').first();
    await dbCard.click();

    await page.waitForURL(/.*\/projects\/[a-f0-9-]+\/diagrams\/db/);

    // Verify AntV X6 canvas loads without errors
    await expect(page.locator('body')).not.toContainText('The request origin is not allowed');
  });
});
