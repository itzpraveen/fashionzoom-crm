import { test, expect } from '@playwright/test'

test.describe('Import Wizard', () => {
  test('upload CSV, map, dedupe, import', async ({ page }) => {
    await page.goto('/import')
    await expect(page.getByRole('heading', { name: 'Import Leads', level: 1 })).toBeVisible()

    const csv = [
      'name,phone,city,source',
      'E2E A,9000000001,Mumbai,Facebook',
      'E2E B,9000000002,Delhi,Instagram',
      'E2E A,09000000001,Mumbai,Facebook' // duplicate normalized
    ].join('\n')
    await page.locator('input[type="file"]').setInputFiles({ name: 'leads.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) })

    // Map columns
    await page.getByPlaceholder('Column for full_name').fill('name')
    await page.getByPlaceholder('Column for primary_phone').fill('phone')
    await page.getByPlaceholder('Column for city').fill('city')
    await page.getByPlaceholder('Column for source').fill('source')
    await page.getByRole('button', { name: 'Next: Dedupe' }).click()

    // Dedupe shows preview
    await expect(page.getByText('Preview (2) unique by normalized phone.')).toBeVisible()
    await page.getByRole('button', { name: 'Import' }).click()

    // Summary
    await expect(page.getByRole('heading', { name: 'Import Complete', level: 3 })).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/Inserted: 2/)).toBeVisible()
  })
})

