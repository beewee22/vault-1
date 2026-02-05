import { test, expect } from "@playwright/test";
import { installTauriMock, stabilizeUi } from "./tauri-mock";

const loginWithToken = async (page: any) => {
  await page.goto("/");
  await page.getByPlaceholder("hvs.xxxxxxxxxxxx").fill("mock-vault-token");
  await page.getByRole("button", { name: "Unlock Vault" }).click();
};

const navigateToSecret = async (page: any) => {
  await page.getByRole("heading", { name: "secret" }).click();
  await page.getByRole("heading", { name: "config" }).click();
};

test.beforeEach(async ({ page }) => {
  await installTauriMock(page, {
    lists: {
      "secret/metadata/": ["config"],
    },
    secrets: {
      "secret/data/config": {
        username: "admin",
        password: "secret123",
      },
    },
  });
  await stabilizeUi(page);
});

test("version history section shows versions", async ({ page }) => {
  await loginWithToken(page);
  await navigateToSecret(page);

  await expect(page.getByRole("heading", { name: "Secret Details" })).toBeVisible();

  await page.getByTestId("version-toggle").click();

  await expect(page.getByTestId("version-history")).toBeVisible();

  await expect(page.getByTestId("version-item-1")).toBeVisible();
  await expect(page.getByTestId("version-item-2")).toBeVisible();
  await expect(page.getByTestId("version-item-3")).toBeVisible();
});

test("comparing two versions shows diff view", async ({ page }) => {
  await installTauriMock(page, {
    lists: {
      "secret/metadata/": ["config"],
    },
    secrets: {
      "secret/data/config": {
        username: "admin",
        password: "secret123",
      },
    },
  });

  await page.addInitScript(() => {
    const originalInvoke = window.__TAURI_INTERNALS__!.invoke!;
    window.__TAURI_INTERNALS__!.invoke = async (command: string, args?: any) => {
      if (command === "fetch_vault_secret" && args?.version) {
        if (args.version === 1) {
          return {
            data: {
              data: { username: "admin", password: "oldpass" },
              metadata: { version: 1 }
            }
          };
        } else if (args.version === 2) {
          return {
            data: {
              data: { username: "admin", password: "newpass" },
              metadata: { version: 2 }
            }
          };
        }
      }
      return originalInvoke(command, args);
    };
  });

  await stabilizeUi(page);
  await loginWithToken(page);
  await navigateToSecret(page);

  await page.getByTestId("version-toggle").click();

  await expect(page.getByTestId("version-history")).toBeVisible();

  const version1Checkbox = page.getByTestId("version-item-1").locator('input[type="checkbox"]');
  const version2Checkbox = page.getByTestId("version-item-2").locator('input[type="checkbox"]');

  await version1Checkbox.check();
  await version2Checkbox.check();

  await page.getByTestId("compare-btn").click();

  await expect(page.getByTestId("version-diff")).toBeVisible();
  await expect(page.getByTestId("diff-left")).toBeVisible();
  await expect(page.getByTestId("diff-right")).toBeVisible();
});

test("CAS conflict shows error toast", async ({ page }) => {
  await installTauriMock(page, {
    lists: {
      "secret/metadata/": ["config"],
    },
    secrets: {
      "secret/data/config": {
        username: "admin",
        password: "secret123",
      },
    },
  });

  await page.addInitScript(() => {
    const originalInvoke = window.__TAURI_INTERNALS__!.invoke!;
    window.__TAURI_INTERNALS__!.invoke = async (command: string, args?: any) => {
      if (command === "save_vault_secret") {
        throw new Error("400: check-and-set parameter did not match");
      }
      return originalInvoke(command, args);
    };
  });

  await stabilizeUi(page);
  await loginWithToken(page);
  await navigateToSecret(page);

  await page.getByTestId("edit-toggle").click();
  await expect(page.getByTestId("field-editor")).toBeVisible();

  const valueInputs = page.locator('input[placeholder="Value"]');
  await valueInputs.last().fill("newpassword456");

  await page.getByTestId("save-edit").click();

  await expect(page.getByText(/modified elsewhere/i)).toBeVisible({ timeout: 5000 });

  await expect(page.getByTestId("field-editor")).toBeVisible();
});
