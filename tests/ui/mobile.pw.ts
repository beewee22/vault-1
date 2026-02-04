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

test("mobile sidebar toggle works", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loginWithToken(page);

  await page.getByTestId("sidebar-overlay").click({ force: true });
  await page.getByRole("button", { name: "Menu" }).click({ force: true });
  await expect(page.getByRole("button", { name: "All Items" })).toBeVisible();
});
