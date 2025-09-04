import { test, expect } from '@playwright/test'

test('telecaller flow skeleton', async ({ page }) => {
  await page.goto('/leads')
  await expect(page.locator('h2', { hasText: 'Overdue' })).toBeVisible()
})

