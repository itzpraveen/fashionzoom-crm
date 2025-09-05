import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test('overview loads with tiles and sections', async ({ page }) => {
    await page.goto('/dashboard/overview')
    await expect(page.getByRole('heading', { name: 'Overview', level: 1 })).toBeVisible()
    // Overdue follow-ups header present
    await expect(page.getByRole('heading', { name: /Overdue follow-ups/i })).toBeVisible()
    // Today’s leads header present
    await expect(page.getByRole('heading', { name: /Today’s leads/i })).toBeVisible()
  })
})

