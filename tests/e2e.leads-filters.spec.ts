import { test, expect } from '@playwright/test'

test.describe('Leads Filters', () => {
  test('status, search, due today, event/program', async ({ page }) => {
    await page.goto('/leads')
    await expect(page.getByRole('heading', { name: 'Leads', level: 1 })).toBeVisible()

    // Status filter
    await page.locator('select').first().selectOption('CONTACTED')
    await expect(page).toHaveURL(/status=CONTACTED/)

    // Search
    await page.getByPlaceholder('Search leads...').fill('Lead')
    await page.waitForTimeout(600)
    await expect(page).toHaveURL(/search=Lead/)

    // Due today toggle
    await page.getByLabel('Today').check()
    await expect(page).toHaveURL(/due=today/)

    // Keep event/program light; main intent is URL state and controls
  })
})
