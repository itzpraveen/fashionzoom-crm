import { test, expect } from '@playwright/test'

test.describe('Templates', () => {
  test('create and delete template', async ({ page }) => {
    await page.goto('/settings/templates')
    await expect(page.getByRole('heading', { name: 'Message Templates', level: 1 })).toBeVisible()

    // Create template
    const name = `E2E Template ${Math.random().toString(36).slice(2,6)}`
    await page.getByPlaceholder('First touch').fill(name)
    await page.getByPlaceholder(/Hello/).fill('Hello {{name}}, this is an E2E message.')
    await page.getByRole('button', { name: 'Add Template' }).click()

    // Template card appears
    const card = page.locator('div.border', { hasText: name })
    await expect(card).toBeVisible({ timeout: 5000 })

    // Delete template
    await card.getByRole('button', { name: 'Delete' }).click()
    await expect(card).toHaveCount(0)
  })
})

