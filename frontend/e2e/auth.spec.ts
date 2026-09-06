import { test, expect } from '@playwright/test';

test.describe('Authentication & Session Management', () => {
  test('should display login page and reject invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/(Quillqay|Qillqay)/i);

    // Verify UI elements
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(page.getByPlaceholder('Email address')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();

    // Fill invalid credentials
    await page.getByPlaceholder('Email address').fill('admin@quillqay.local');
    await page.getByPlaceholder('Password').fill('wrongpassword');
    await page.getByRole('button', { name: /Sign in/i }).click();

    // Should display invalid credentials alert
    await expect(page.getByText(/Invalid/i)).toBeVisible({ timeout: 5000 });
    expect(page.url()).toContain('/login');
  });

  test('should successfully authenticate with valid credentials and redirect to /projects', async ({ page }) => {
    await page.goto('/login');

    await page.getByPlaceholder('Email address').fill('admin@quillqay.local');
    await page.getByPlaceholder('Password').fill('change-this-development-password');
    await page.getByRole('button', { name: /Sign in/i }).click();

    // Wait for redirect to /projects
    await page.waitForURL('**/projects');
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();

    // Verify session cookie was set
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find((c) => c.name === 'quillqay_session');
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.httpOnly).toBe(true);
  });
});
