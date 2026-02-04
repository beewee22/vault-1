import { test, expect } from "@playwright/test";
import { installTauriMock } from "./tauri-mock";

test.beforeEach(async ({ page }) => {
  await installTauriMock(page);
});

test("login Add New opens profile modal", async ({ page }) => {
  await page.goto("/");

  await page.locator("button", { hasText: "+ Add New" }).click();
  await expect(page.getByRole("heading", { name: "Add Vault Profile" })).toBeVisible();
});

test("profile modal can be closed from login", async ({ page }) => {
  await page.goto("/");

  await page.locator("button", { hasText: "+ Add New" }).click();
  const modalHeading = page.getByRole("heading", { name: "Add Vault Profile" });
  await expect(modalHeading).toBeVisible();

  await page.getByRole("button", { name: "Close" }).click();
  await expect(modalHeading).toBeHidden();
});
