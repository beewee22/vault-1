import { test, expect } from "@playwright/test";
import { installTauriMock, stabilizeUi } from "./tauri-mock";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const oidcProfile = {
      id: 'oidc-test',
      name: 'OIDC Test',
      url: 'https://vault.example.com',
      token: '',
      authMethod: 'oidc',
      oidcMountPath: 'oidc',
      oidcRole: 'admin'
    };
    localStorage.setItem('vault_profiles', JSON.stringify([oidcProfile]));
    localStorage.setItem('vault_active_profile', 'oidc-test');
  });
  
  await installTauriMock(page);
  await stabilizeUi(page);
});

test("OIDC profile shows correct URL in read-only field", async ({ page }) => {
  await page.goto("/");
  
  const urlInput = page.locator('input[type="text"][readonly]');
  await expect(urlInput).toHaveValue("https://vault.example.com");
});

test("OIDC login invokes with correct URL from profile", async ({ page }) => {
  await page.goto("/");
  
  await page.getByRole("button", { name: /Sign in with OIDC/ }).click();
  
  // Wait for dashboard to appear (any element after login)
  await expect(page.getByRole("heading", { name: "All Mounts" })).toBeVisible({ timeout: 5000 });
  
  const oidcArgs = await page.evaluate(() => (window as any).__OIDC_LOGIN_ARGS__);
  expect(oidcArgs.url).toBe("https://vault.example.com");
  expect(oidcArgs.mountPath).toBe("oidc");
  expect(oidcArgs.role).toBe("admin");
});

test("OIDC login success transitions to dashboard", async ({ page }) => {
  await page.goto("/");
  
  await page.getByRole("button", { name: /Sign in with OIDC/ }).click();
  
  // Wait for login screen to disappear and main layout to appear
  await expect(page.getByRole("heading", { name: "Unlock Your Vault" })).toBeHidden({ timeout: 5000 });
  await expect(page.getByRole("heading", { name: "All Mounts" })).toBeVisible({ timeout: 5000 });
});
