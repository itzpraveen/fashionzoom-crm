import { test, expect } from '@playwright/test'

test.describe('Queue', () => {
  test('shows sections or empty state', async ({ page }) => {
    await page.goto('/dashboard/queue')
    // Either empty state or some section headings
    const empty = page.getByText('No leads in your queue')
    const overdue = page.getByRole('heading', { name: /Overdue \(/ })
    const dueSoon = page.getByRole('heading', { name: /Due soon \(/ })
    const fresh = page.getByRole('heading', { name: /New \(/ })
    const visible = await Promise.race([
      empty.waitFor({ state: 'visible' }).then(() => true).catch(() => false),
      overdue.waitFor({ state: 'visible' }).then(() => true).catch(() => false),
      dueSoon.waitFor({ state: 'visible' }).then(() => true).catch(() => false),
      fresh.waitFor({ state: 'visible' }).then(() => true).catch(() => false),
      page.waitForTimeout(5000).then(() => false)
    ])
    expect(visible).toBeTruthy()
  })
})

