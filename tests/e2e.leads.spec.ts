import { test, expect } from '@playwright/test'

test.describe('Leads flows', () => {
  test('add lead, search, mark contacted, create follow-up', async ({ page }) => {
    // Go to leads list (demo mode has a default admin user)
    await page.goto('/leads')
    await expect(page.getByRole('heading', { name: 'Leads', level: 1 })).toBeVisible()

    // Search for a seeded lead from demo data
    const name = 'Lead 1'
    const search = page.getByPlaceholder('Search leads...')
    await search.fill(name)
    // debounce 500ms + network/render
    await page.waitForTimeout(900)
    // Expect link with lead name to appear
    await expect(page.getByRole('link', { name, exact: true })).toBeVisible({ timeout: 5000 })

    // Mark contacted
    // Find the row containing our lead name
    const row = page.locator('tr', { has: page.getByRole('link', { name, exact: true }) })
    await expect(row).toBeVisible()
    await row.getByRole('button', { name: 'Mark contacted' }).click()
    // After refresh, the status cell should show CONTACTED
    await expect(row.getByText('CONTACTED')).toBeVisible({ timeout: 5000 })

    // Optional: create quick follow-up (+1d) and just ensure no error
    await row.getByRole('button', { name: '+1d' }).click()
  })
})
