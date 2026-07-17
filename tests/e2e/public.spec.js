const { test, expect } = require('@playwright/test');

test('public visitor can open the home page and browse classes', async ({ page }) => {
  await page.route(/\/api\/classes$/, route => route.fulfill({ json: [{
    _id: '000000000000000000000001', title: 'Power Hour', category: 'Strength', level: 'Intermediate',
    duration: 50, trainerName: 'FitFlow Trainer', schedule: 'Mon - 6:30 PM', spotsLeft: 12, accent: '#c7f36b'
  }] }));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Train with a rhythm');
  await page.getByRole('link', { name: 'View live classes' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Find a class');
  await expect(page.locator('.class-card').first()).toBeVisible();
});

test('keyboard skip link reaches main content', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
});

test('class filters narrow the catalog without a page reload', async ({ page }) => {
  await page.route(/\/api\/classes$/, route => route.fulfill({ json: [
    { _id: '000000000000000000000001', title: 'Power Hour', category: 'Strength', level: 'Intermediate', duration: 50, trainerName: 'Maya', schedule: 'Mon - 6:30 PM', spotsLeft: 12, accent: '#c7f36b' },
    { _id: '000000000000000000000002', title: 'Flow State', category: 'Yoga', level: 'Beginner', duration: 45, trainerName: 'Arun', schedule: 'Wed - 7:00 AM', spotsLeft: 8, accent: '#a9ddff' }
  ] }));
  await page.goto('/classes');
  await expect(page.getByRole('heading', { name: 'Power Hour' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Flow State' })).toBeVisible();

  await page.getByRole('button', { name: 'Yoga', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Flow State' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Power Hour' })).toHaveCount(0);
});

test('guest booking redirects to authentication and exposes password recovery', async ({ page }) => {
  await page.route(/\/api\/classes$/, route => route.fulfill({ json: [{
    _id: '000000000000000000000001', title: 'Power Hour', category: 'Strength', level: 'Intermediate',
    duration: 50, trainerName: 'FitFlow Trainer', schedule: 'Mon - 6:30 PM', spotsLeft: 12, accent: '#c7f36b'
  }] }));
  await page.goto('/classes');
  await page.getByRole('button', { name: 'Book', exact: true }).click();
  await expect(page).toHaveURL(/\/auth$/);
  await expect(page.getByRole('heading', { name: 'Keep it moving.' })).toBeVisible();

  await page.getByRole('button', { name: 'Forgot password?', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Where should we send it?' })).toBeVisible();
});
