import { test, expect } from '@playwright/test'

test('leads page renders', async ({ page }) => {
  await page.goto('/leads')
  const h1 = page.getByRole('heading', { name: 'Leads', level: 1 })
  await expect(h1).toBeVisible({ timeout: 8000 })
})
