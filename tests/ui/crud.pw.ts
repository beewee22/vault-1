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

test("clicking edit toggle enables field editing", async ({ page }) => {
  await loginWithToken(page);
  await navigateToSecret(page);

  // Wait for detail view to load
  await expect(page.getByRole("heading", { name: "Secret Details" })).toBeVisible();

  // Click edit toggle button
  await page.getByTestId("edit-toggle").click();

  // Assert: field editor is visible
  await expect(page.getByTestId("field-editor")).toBeVisible();

  // Assert: save button exists
  await expect(page.getByTestId("save-edit")).toBeVisible();
});

test("saving edited secret shows success toast", async ({ page }) => {
  await loginWithToken(page);
  await navigateToSecret(page);

  // Enter edit mode
  await page.getByTestId("edit-toggle").click();
  await expect(page.getByTestId("field-editor")).toBeVisible();

  // Modify a field value (find the password input and change it)
  const valueInputs = page.locator('input[placeholder="Value"]');
  await valueInputs.last().fill("newpassword456");

  // Click save
  await page.getByTestId("save-edit").click();

  // Wait for success toast
  await expect(page.getByText(/Secret updated/i)).toBeVisible({ timeout: 5000 });
});

test("delete secret shows confirmation and succeeds", async ({ page }) => {
  await loginWithToken(page);
  await navigateToSecret(page);

  // Click delete button
  await page.getByTestId("delete-secret").click();

  // Assert: confirmation dialog visible
  await expect(page.getByRole("heading", { name: "Delete Secret" })).toBeVisible();

  // Click confirm delete
  await page.getByTestId("delete-confirm").click();

  // Wait for success toast
  await expect(page.getByText(/deleted/i)).toBeVisible({ timeout: 5000 });

  // Assert: navigated back to list (Secret Details heading should be gone)
  await expect(page.getByRole("heading", { name: "Secret Details" })).toBeHidden({ timeout: 5000 });
});

test("destroy requires typing secret name", async ({ page }) => {
  await loginWithToken(page);
  await navigateToSecret(page);

  // Click destroy button
  await page.getByTestId("destroy-secret").click();

  // Assert: confirmation dialog visible
  await expect(page.getByRole("heading", { name: "Destroy All Versions" })).toBeVisible();

  // Assert: type-to-confirm input visible
  const confirmInput = page.getByTestId("destroy-confirm-input");
  await expect(confirmInput).toBeVisible();

  // Assert: destroy button is disabled initially
  const destroyButton = page.getByTestId("destroy-confirm");
  await expect(destroyButton).toBeDisabled();

  // Type incorrect name
  await confirmInput.fill("wrong-name");
  await expect(destroyButton).toBeDisabled();

  // Type correct secret name
  await confirmInput.fill("config");
  await expect(destroyButton).toBeEnabled();

  // Click destroy
  await destroyButton.click();

  // Wait for success toast
  await expect(page.getByText(/All versions destroyed/i)).toBeVisible({ timeout: 5000 });

  // Assert: navigated back to list
  await expect(page.getByRole("heading", { name: "Secret Details" })).toBeHidden({ timeout: 5000 });
});
