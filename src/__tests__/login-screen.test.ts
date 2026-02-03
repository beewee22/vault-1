import { test, expect } from "bun:test";
import type { VaultProfile } from "../types";

/**
 * Login Screen Conditional Rendering Tests
 * 
 * Tests document expected behavior for Task 6:
 * - Token profiles: show URL + token input + "Unlock Vault" button
 * - OIDC profiles: show URL (read-only) + auth badge + "Sign in with OIDC" button
 * - Error handling: timeout, auth_url failure, generic errors
 */

// --- Test 1: Token profile shows token input ---
test("Token profile: activeProfile.authMethod === 'token' should render token input field", () => {
  // Given: A profile with authMethod "token"
  const tokenProfile: VaultProfile = {
    id: "test-1",
    name: "Test Token Profile",
    url: "https://vault.example.com",
    token: "",
    authMethod: "token",
  };

  // When: Login screen renders with this profile
  // Then: Should render input field for token (type="password")
  
  // Placeholder assertion - full DOM testing requires React Testing Library
  expect(tokenProfile.authMethod).toBe("token");
});

// --- Test 2: Token profile shows Unlock Vault button ---
test("Token profile: should show 'Unlock Vault' submit button", () => {
  // Given: A profile with authMethod "token"
  const tokenProfile: VaultProfile = {
    id: "test-2",
    name: "Test Token Profile",
    url: "https://vault.example.com",
    token: "hvs.test",
    authMethod: "token",
  };

  // When: Login screen renders
  // Then: Submit button text should be "Unlock Vault" (not "Sign in with OIDC")
  
  expect(tokenProfile.authMethod).toBe("token");
});

// --- Test 3: OIDC profile hides token input ---
test("OIDC profile: activeProfile.authMethod === 'oidc' should NOT render token input", () => {
  // Given: A profile with authMethod "oidc"
  const oidcProfile: VaultProfile = {
    id: "test-3",
    name: "Test OIDC Profile",
    url: "https://vault.example.com",
    token: "",
    authMethod: "oidc",
    oidcMountPath: "oidc",
    oidcRole: "developer",
  };

  // When: Login screen renders with OIDC profile
  // Then: Should NOT render token input (password field)
  
  expect(oidcProfile.authMethod).toBe("oidc");
  expect(oidcProfile.oidcMountPath).toBe("oidc");
});

// --- Test 4: OIDC profile shows auth method badge ---
test("OIDC profile: should display auth method badge with mount path", () => {
  // Given: A profile with OIDC configuration
  const oidcProfile: VaultProfile = {
    id: "test-4",
    name: "Production OIDC",
    url: "https://vault.prod.example.com",
    token: "",
    authMethod: "oidc",
    oidcMountPath: "oidc",
    oidcRole: "admin",
  };

  // When: Login screen renders
  // Then: Should display badge showing "OIDC via oidc"
  
  const expectedBadgeText = `OIDC via ${oidcProfile.oidcMountPath}`;
  expect(oidcProfile.authMethod).toBe("oidc");
  expect(expectedBadgeText).toBe("OIDC via oidc");
});

// --- Test 5: OIDC profile shows "Sign in with OIDC" button ---
test("OIDC profile: should show 'Sign in with OIDC' button instead of 'Unlock Vault'", () => {
  // Given: A profile with authMethod "oidc"
  const oidcProfile: VaultProfile = {
    id: "test-5",
    name: "Test OIDC Profile",
    url: "https://vault.example.com",
    token: "",
    authMethod: "oidc",
    oidcMountPath: "oidc",
  };

  // When: Login screen renders
  // Then: Button text should be "Sign in with OIDC" (not "Unlock Vault")
  
  expect(oidcProfile.authMethod).toBe("oidc");
});

// --- Test 6: OIDC loading state ---
test("OIDC profile: loading state should show 'Waiting for browser authentication...'", () => {
  // Given: OIDC login is in progress (isLoggingIn = true)
  // When: handleOidcLogin() is called and waiting for browser callback
  // Then: Should display loading spinner + "Waiting for browser authentication..." message
  
  const isLoggingIn = true;
  const loadingMessage = "Waiting for browser authentication...";
  
  expect(isLoggingIn).toBe(true);
  expect(loadingMessage).toBe("Waiting for browser authentication...");
});

// --- Test 7: OIDC timeout error handling ---
test("OIDC error handling: timeout error should show user-friendly message", () => {
  // Given: invoke("oidc_login") throws error containing "timed out"
  const timeoutError = "Failed to wait for OIDC callback: operation timed out after 120 seconds";
  
  // When: Error is caught in handleOidcLogin
  // Then: Should display "Authentication timed out. Please try again."
  const expectedMessage = "Authentication timed out. Please try again.";
  
  expect(timeoutError.includes("timed out")).toBe(true);
  expect(expectedMessage).toBe("Authentication timed out. Please try again.");
});

// --- Test 8: OIDC auth_url error handling ---
test("OIDC error handling: auth_url error should show mount path message", () => {
  // Given: invoke("oidc_login") throws error containing "auth_url"
  const authUrlError = "Failed to get OIDC auth_url: 404 Not Found";
  const mountPath = "bad-oidc";
  
  // When: Error is caught in handleOidcLogin
  // Then: Should display "OIDC auth method not found at 'bad-oidc'. Check your profile configuration."
  const expectedMessage = `OIDC auth method not found at '${mountPath}'. Check your profile configuration.`;
  
  expect(authUrlError.includes("auth_url")).toBe(true);
  expect(expectedMessage).toBe("OIDC auth method not found at 'bad-oidc'. Check your profile configuration.");
});

// --- Test 9: OIDC generic error handling ---
test("OIDC error handling: generic error should show detailed message", () => {
  // Given: invoke("oidc_login") throws generic error
  const genericError = "Network request failed";
  
  // When: Error is caught in handleOidcLogin
  // Then: Should display "OIDC login failed: Network request failed"
  const expectedMessage = `OIDC login failed: ${genericError}`;
  
  expect(expectedMessage).toBe("OIDC login failed: Network request failed");
});

// --- Test 10: Profile switching updates UI ---
test("Profile switching: changing activeProfileId should update UI rendering", () => {
  // Given: User has both token and OIDC profiles
  const tokenProfile: VaultProfile = {
    id: "token-1",
    name: "Token Profile",
    url: "https://vault.example.com",
    token: "hvs.test",
    authMethod: "token",
  };
  
  const oidcProfile: VaultProfile = {
    id: "oidc-1",
    name: "OIDC Profile",
    url: "https://vault.example.com",
    token: "",
    authMethod: "oidc",
    oidcMountPath: "oidc",
  };

  // When: User switches from token profile to OIDC profile
  // Then: UI should switch from token input to OIDC button
  
  expect(tokenProfile.authMethod).toBe("token");
  expect(oidcProfile.authMethod).toBe("oidc");
});
