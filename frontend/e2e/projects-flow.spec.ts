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

  test('should navigate to diagrams, create a new schema diagram and verify persistence', async ({ page }) => {
    const schemaTitle = `E2E Schema ${Date.now()}`;

    // Open the first available project
    const openLink = page.getByRole('link', { name: /Open/i }).first();
    await openLink.click();

    await page.waitForURL(/.*\/projects\/[a-f0-9-]+/);

    // Navigate to Diagrams tab
    const diagramsLink = page.locator('aside nav a[href*="/diagrams"]');
    await diagramsLink.click();
    await page.waitForURL(/.*\/projects\/[a-f0-9-]+\/diagrams/);

    // Click "New Diagram" button
    const newDiagramBtn = page.getByRole('button', { name: /New Diagram/i }).first();
    await newDiagramBtn.click();

    // Fill diagram title in modal
    await page.getByPlaceholder(/e.g. Orders & Payments Schema/i).fill(schemaTitle);
    
    // Submit creation inside form modal
    await page.locator('form').getByRole('button', { name: /Create Diagram/i }).click();

    // Should navigate to the AntV X6 DB diagram editor
    await page.waitForURL(/.*\/projects\/[a-f0-9-]+\/diagrams\/db\/[a-f0-9-]+/);

    // Verify Save button is visible and click it
    const saveBtn = page.getByRole('button', { name: /Save/i }).first();
    await expect(saveBtn).toBeVisible({ timeout: 10000 });
    await saveBtn.click();

    // Navigate back to Diagrams Hub
    const backBtn = page.getByLabel(/Back to diagrams/i);
    await backBtn.click();
    await page.waitForURL(/.*\/projects\/[a-f0-9-]+\/diagrams/);

    // Verify the newly created diagram is displayed in the list from PostgreSQL
    await expect(page.getByText(schemaTitle)).toBeVisible({ timeout: 10000 });
  });

  test('should support multi-dialect SQL DDL import and render tables', async ({ page }) => {
    // Open the first available project
    const openLink = page.getByRole('link', { name: /Open/i }).first();
    await openLink.click();
    await page.waitForURL(/.*\/projects\/[a-f0-9-]+/);

    // Navigate to Diagrams tab
    const diagramsLink = page.locator('aside nav a[href*="/diagrams"]');
    await diagramsLink.click();
    await page.waitForURL(/.*\/projects\/[a-f0-9-]+\/diagrams/);

    // Click "New Diagram" button
    const newDiagramBtn = page.getByRole('button', { name: /New Diagram/i }).first();
    await newDiagramBtn.click();

    const importDiagramTitle = `Import DDL Test ${Date.now()}`;
    await page.getByPlaceholder(/e.g. Orders & Payments Schema/i).fill(importDiagramTitle);
    await page.locator('form').getByRole('button', { name: /Create Diagram/i }).click();

    await page.waitForURL(/.*\/projects\/[a-f0-9-]+\/diagrams\/db\/[a-f0-9-]+/);

    // Click "Import Schema" button in top toolbar
    const importBtn = page.getByRole('button', { name: /Import Schema/i }).first();
    await expect(importBtn).toBeVisible({ timeout: 10000 });
    await importBtn.click();

    // Verify modal elements in Step 1
    await expect(page.getByText(/What is your Database\?/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /^PostgreSQL/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^MySQL/i })).toBeVisible();

    // Select PostgreSQL and Continue
    await page.getByRole('button', { name: /^PostgreSQL/i }).click();
    await page.getByRole('button', { name: /Continue/i }).click();

    // Step 2: Load Sample and Import
    await page.getByRole('button', { name: /Load Sample/i }).click();

    // Click Import
    const doImportBtn = page.getByRole('button', { name: /Import PostgreSQL Schema/i });
    await expect(doImportBtn).toBeVisible();
    await doImportBtn.click();

    // Verify modal closes and tables appear in sidebar
    await expect(page.getByText(/users/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/profiles/i).first()).toBeVisible({ timeout: 10000 });

    // Save diagram
    const saveBtn = page.getByRole('button', { name: /Save/i }).first();
    await saveBtn.click();
  });
});
