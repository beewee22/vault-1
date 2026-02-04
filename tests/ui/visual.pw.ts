import { test, expect } from "@playwright/test";
import { installTauriMock, stabilizeUi } from "./tauri-mock";

const loginWithToken = async (page: any) => {
  await page.goto("/");
  await page.getByPlaceholder("hvs.xxxxxxxxxxxx").fill("hvs.test-token");
  await page.getByRole("button", { name: "Unlock Vault" }).click();
};

test.beforeEach(async ({ page }) => {
  await installTauriMock(page);
  await stabilizeUi(page);
});

test("login screen matches snapshot", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveScreenshot("login.png");
});

test("dashboard mounts list matches snapshot", async ({ page }) => {
  await loginWithToken(page);
  await expect(page).toHaveScreenshot("dashboard-mounts.png");
});
