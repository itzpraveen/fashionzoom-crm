import { test, expect } from '@playwright/test'

test.describe('Events & Programs CRUD', () => {
  test.fixme('create event, add program, delete program and event', async ({ page }) => {
    await page.goto('/settings/events')
    await expect(page.getByRole('heading', { name: 'Events & Programs', level: 1 })).toBeVisible()

    const evName = `E2E Event ${Math.random().toString(36).slice(2,6)}`
    await page.getByPlaceholder('Fashion Week').fill(evName)
    await page.getByRole('button', { name: 'Create' }).click()
    await page.reload()
    const card = page.locator('div.border', { hasText: evName }).first()
    await expect(card).toBeVisible({ timeout: 10000 })

    // Add a program
    await card.getByPlaceholder('Designer Runway').fill('E2E Program')
    await card.getByRole('button', { name: 'Add' }).first().click()
    await expect(card.getByText('E2E Program')).toBeVisible({ timeout: 5000 })

    // Delete program
    page.once('dialog', d => d.accept())
    await card.locator('tr', { hasText: 'E2E Program' }).getByRole('button', { name: 'Delete' }).click()
    await expect(card.getByText('E2E Program')).toHaveCount(0)

    // Delete event
    page.once('dialog', d => d.accept())
    await card.getByRole('button', { name: 'Delete Event' }).click()
    await expect(card).toHaveCount(0)
  })
})
