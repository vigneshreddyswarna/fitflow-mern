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
