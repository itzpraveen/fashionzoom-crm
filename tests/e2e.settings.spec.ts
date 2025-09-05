import { test, expect } from '@playwright/test'

test.describe('Settings: Events & Programs', () => {
  test('load and view events & programs', async ({ page }) => {
    await page.goto('/settings/events')
    await expect(page.getByRole('heading', { name: 'Events & Programs', level: 1 })).toBeVisible()

    // Expect to see existing seeded events and programs
    await expect(page.locator('input[value="Fashion Week"]').first()).toBeVisible()
    await expect(page.locator('input[value="Resort Showcase"]').first()).toBeVisible()
    // Programs table shows at least one program row
    await expect(page.locator('input[value="Designer Runway"]').first()).toBeVisible()
  })
})
