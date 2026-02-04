import { test, expect } from "@playwright/test";
import { installTauriMock, stabilizeUi } from "./tauri-mock";

const loginWithToken = async (page: any) => {
  await page.goto("/");
  await page.getByPlaceholder("hvs.xxxxxxxxxxxx").fill("mock-vault-token");
  await page.getByRole("button", { name: "Unlock Vault" }).click();
};

test.beforeEach(async ({ page }) => {
  await installTauriMock(page);
  await stabilizeUi(page);
});

test("login shows mounts list", async ({ page }) => {
  await loginWithToken(page);

  await expect(page.getByRole("heading", { name: "All Mounts" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "secret" })).toBeVisible();
});

test("clicking mount loads secret list", async ({ page }) => {
  await loginWithToken(page);

  await page.getByRole("heading", { name: "secret" }).click();
  await expect(page.getByRole("heading", { name: /secret\// })).toBeVisible();
  await expect(page.getByRole("heading", { name: "config" })).toBeVisible();
});

test("policies tab shows policies", async ({ page }) => {
  await loginWithToken(page);

  await page.getByRole("button", { name: "Policies" }).click();
  await expect(page.getByRole("heading", { name: "Policy Management" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "default" })).toBeVisible();
});
