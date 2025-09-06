import { test, expect } from '@playwright/test'

test.use({ viewport: { width: 1200, height: 900 } })

test.describe('Teams (Admin)', () => {
  test('create team and invite user (demo)', async ({ page }) => {
    await page.goto('/settings/teams')
    await expect(page.getByRole('heading', { name: 'Teams', level: 1 })).toBeVisible()

    // Create team
    const teamName = `E2E Team ${Math.random().toString(36).slice(2,6)}`
    await page.getByPlaceholder('Team name').fill(teamName)
    await page.getByRole('button', { name: 'Create' }).click()
    await page.reload()
    await expect(page.locator(`input[value="${teamName}"]`).first()).toHaveCount(1)

    // Assign user to team (demo mode local store)
    const email = `e2e_${Math.random().toString(36).slice(2,6)}@example.com`
    const assignForm = page.locator('xpath=//h2[contains(.,"Assign User")]/following::form[1]')
    await assignForm.getByPlaceholder('user@example.com').fill(email)
    await assignForm.getByPlaceholder('uuid').click({ force: true })
    // Select team and role by first and second selects
    await assignForm.locator('select').first().selectOption({ label: teamName })
    await assignForm.locator('select').nth(1).selectOption('TELECALLER')
    await assignForm.getByRole('button', { name: 'Assign' }).click()
    await page.reload()

    // Member appears in list
    await expect(page.getByText(email).first()).toBeVisible({ timeout: 10000 })
  })
})
