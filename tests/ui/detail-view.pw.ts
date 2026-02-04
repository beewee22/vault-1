import { test, expect } from "@playwright/test";
import { installTauriMock, stabilizeUi } from "./tauri-mock";

const loginWithToken = async (page: any) => {
  await page.goto("/");
  await page.getByPlaceholder("hvs.xxxxxxxxxxxx").fill("hvs.test-token");
  await page.getByRole("button", { name: "Unlock Vault" }).click();
};

test.beforeEach(async ({ page }) => {
  await installTauriMock(page, {
    lists: {
      "secret/metadata/": ["config"],
    },
    secrets: {
      "secret/data/config": {
        username: "admin",
        env: "production",
        long_value: "x".repeat(128),
      },
    },
  });
  await stabilizeUi(page);
});

test("open secret detail and reveal fields", async ({ page }) => {
  await loginWithToken(page);

  await page.getByRole("heading", { name: "secret" }).click();
  await page.getByRole("heading", { name: "config" }).click();

  await expect(page.getByRole("heading", { name: "Secret Details" })).toBeVisible();
  await expect(page.getByText("username")).toBeVisible();
  await expect(page.getByText("env")).toBeVisible();
});
