import { test, expect } from '@playwright/test'

test('leads page renders', async ({ page }) => {
  await page.goto('/leads')
  const overdue = page.getByRole('heading', { name: 'Overdue' })
  const empty = page.getByText('You are not signed in')
  const visible = await Promise.race([
    overdue.waitFor({ state: 'visible' }).then(() => true).catch(() => false),
    empty.waitFor({ state: 'visible' }).then(() => true).catch(() => false),
    page.waitForTimeout(5000).then(() => false)
  ])
  expect(visible).toBeTruthy()
})
