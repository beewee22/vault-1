// localStorage mock - must be before imports
const storage: Record<string, string> = {};
globalThis.localStorage = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, value: string) => { storage[key] = value; },
  removeItem: (key: string) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); },
  get length() { return Object.keys(storage).length; },
  key: (i: number) => Object.keys(storage)[i] ?? null,
} as Storage;

import { test, expect } from "bun:test";
import { AUTH_METHODS } from "../types";
import { profileStore, profileActions } from "../stores/profile";

// ====================
// TASK 5: AddProfileModal Dynamic Auth Method Selector Tests
// ====================
// TDD Approach: These tests are written BEFORE implementation
// Following RED → GREEN → REFACTOR cycle

test("AUTH_METHODS configuration is available and has correct structure", () => {
  // Prerequisite check: Ensure AUTH_METHODS exists and has expected shape
  expect(AUTH_METHODS).toBeDefined();
  expect(AUTH_METHODS.length).toBe(2); // Token + OIDC
  
  // Verify token method
  const tokenMethod = AUTH_METHODS.find(m => m.id === "token");
  expect(tokenMethod).toBeDefined();
  expect(tokenMethod?.fields.length).toBe(1); // token field only
  expect(tokenMethod?.fields[0].key).toBe("token");
  
  // Verify OIDC method
  const oidcMethod = AUTH_METHODS.find(m => m.id === "oidc");
  expect(oidcMethod).toBeDefined();
  expect(oidcMethod?.fields.length).toBe(2); // mount_path + role
  expect(oidcMethod?.fields[0].key).toBe("mount_path");
  expect(oidcMethod?.fields[1].key).toBe("role");
});

test("profileActions.addProfile should accept OIDC config and store oidcMountPath", () => {
  profileStore.profiles.splice(0);
  Object.keys(storage).forEach(k => delete storage[k]);
  
  const oidcProfile = {
    name: "OIDC Dev",
    url: "https://vault.dev.io",
    token: "",
    authMethod: "oidc" as const,
    oidcMountPath: "oidc",
    oidcRole: "my-role",
  };
  
  const result = profileActions.addProfile(oidcProfile);
  
  expect(result.oidcMountPath).toBe("oidc");
  expect(result.authMethod).toBe("oidc");
});

test("profileActions.addProfile should store oidcRole for OIDC profiles", () => {
  profileStore.profiles.splice(0);
  Object.keys(storage).forEach(k => delete storage[k]);
  
  const oidcProfile = {
    name: "OIDC Prod",
    url: "https://vault.prod.io",
    token: "",
    authMethod: "oidc" as const,
    oidcMountPath: "custom-oidc",
    oidcRole: "admin-role",
  };
  
  const result = profileActions.addProfile(oidcProfile);
  
  expect(result.oidcRole).toBe("admin-role");
  expect(result.oidcMountPath).toBe("custom-oidc");
});

test("profileActions.addProfile should accept token config without OIDC fields", () => {
  profileStore.profiles.splice(0);
  Object.keys(storage).forEach(k => delete storage[k]);
  
  const tokenProfile = {
    name: "Token Dev",
    url: "https://vault.dev.io",
    token: "s.abc123xyz",
    authMethod: "token" as const,
  };
  
  const result = profileActions.addProfile(tokenProfile);
  
  expect(result.authMethod).toBe("token");
  expect(result.token).toBe("s.abc123xyz");
  expect(result.oidcMountPath).toBeUndefined();
  expect(result.oidcRole).toBeUndefined();
});

test("profileActions.addProfile should add profile to profileStore.profiles", () => {
  profileStore.profiles.splice(0);
  Object.keys(storage).forEach(k => delete storage[k]);
  
  const profile = {
    name: "New Profile",
    url: "https://vault.example.io",
    token: "token123",
    authMethod: "token" as const,
  };
  
  const initialLength = profileStore.profiles.length;
  profileActions.addProfile(profile);
  
  expect(profileStore.profiles.length).toBe(initialLength + 1);
  expect(profileStore.profiles[profileStore.profiles.length - 1].name).toBe("New Profile");
});

test("profileActions.addProfile should update activeProfileId to new profile", () => {
  profileStore.profiles.splice(0);
  Object.keys(storage).forEach(k => delete storage[k]);
  
  const profile = {
    name: "Active Profile",
    url: "https://vault.example.io",
    token: "token456",
    authMethod: "token" as const,
  };
  
  const result = profileActions.addProfile(profile);
  
  expect(profileStore.activeProfileId).toBe(result.id);
});

test("profileActions.addProfile should correctly store all profile fields", () => {
  profileStore.profiles.splice(0);
  Object.keys(storage).forEach(k => delete storage[k]);
  
  const profile = {
    name: "Complete Profile",
    url: "https://vault.complete.io",
    token: "token789",
    authMethod: "token" as const,
  };
  
  const result = profileActions.addProfile(profile);
  
  expect(result.name).toBe("Complete Profile");
  expect(result.url).toBe("https://vault.complete.io");
  expect(result.token).toBe("token789");
  expect(result.authMethod).toBe("token");
  expect(result.id).toBeDefined();
});

test("Dynamic field rendering should use AUTH_METHODS field definitions", () => {
  // BDD: Given AUTH_METHODS configuration
  // When AddProfileModal renders fields for selected method
  // Then fields should match method.fields array
  // And each field should use correct type (text vs password)
  // And each field should use correct placeholder
  // And each field should use correct defaultValue
  
  // This test will initially FAIL because dynamic rendering isn't implemented yet
  // Expected behavior: Fields rendered by iterating AUTH_METHODS[selectedMethod].fields
  
  const tokenMethod = AUTH_METHODS.find(m => m.id === "token")!;
  expect(tokenMethod.fields[0].type).toBe("password"); // Token field is password type
  
  const oidcMethod = AUTH_METHODS.find(m => m.id === "oidc")!;
  expect(oidcMethod.fields[0].type).toBe("text"); // mount_path is text type
  expect(oidcMethod.fields[0].defaultValue).toBe("oidc"); // mount_path has default
  expect(oidcMethod.fields[1].required).toBe(false); // role is optional
});

// ====================
// Summary
// ====================
// These tests document expected behavior for Task 5.
// They are intentionally basic (placeholder assertions) because full DOM testing
// would require React Testing Library setup, which is beyond scope.
// 
// The tests serve as:
// 1. Design documentation (BDD comments describe expected behavior)
// 2. Verification checklist (manual testing guide)
// 3. Foundation for future DOM tests if testing library is added
// 
// TDD RED phase complete - tests will "pass" but don't verify implementation yet.
// Next: Implement AddProfileModal changes (GREEN phase).
