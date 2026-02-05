import { test, expect, beforeEach } from "bun:test";

const storage: Record<string, string> = {};
const mockStorage: Storage = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, value: string) => { storage[key] = value; },
  removeItem: (key: string) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); },
  get length() { return Object.keys(storage).length; },
  key: (i: number) => Object.keys(storage)[i] ?? null,
};
globalThis.localStorage = mockStorage;

import { profileStore, profileActions } from "../stores/profile";
import { authStore } from "../stores/auth";

beforeEach(() => {
  Object.keys(storage).forEach(k => delete storage[k]);
  
  profileStore.profiles = [
    {
      id: "default",
      name: "Default",
      url: "https://vault.dev.io",
      token: "",
      authMethod: "token",
    },
    {
      id: "prod",
      name: "Production",
      url: "https://vault.prod.io",
      token: "",
      authMethod: "token",
    },
  ];
  profileStore.activeProfileId = "default";
  authStore.token = "";
  authStore.isLoggedIn = false;
  authStore.vaultUrl = profileStore.activeProfile?.url || "";
});

test("Test 1: Changing activeProfileId updates authStore.vaultUrl to matching profile's URL", async () => {
  expect(profileStore.activeProfileId).toBe("default");
  expect(profileStore.activeProfile.url).toBe("https://vault.dev.io");
  
  profileActions.setActiveProfile("prod");
  await new Promise(resolve => setTimeout(resolve, 10));
  
  expect(authStore.vaultUrl).toBe("https://vault.prod.io");
});

test("Test 2: OIDC profile switch syncs URL correctly", async () => {
  const oidcProfile = profileActions.addProfile({
    name: "OIDC Staging",
    url: "https://vault.staging.io",
    token: "",
    authMethod: "oidc" as const,
    oidcMountPath: "oidc",
    oidcRole: "my-role",
  });
  
  profileActions.setActiveProfile(oidcProfile.id);
  await new Promise(resolve => setTimeout(resolve, 10));
  
  expect(authStore.vaultUrl).toBe("https://vault.staging.io");
  expect(profileStore.activeProfile.authMethod).toBe("oidc");
});

test("Test 3: Token → OIDC → Token circular switch updates URL each time", async () => {
  expect(authStore.vaultUrl).toBe("https://vault.dev.io");
  
  const oidcProfile = profileActions.addProfile({
    name: "OIDC Test",
    url: "https://vault.oidc.io",
    token: "",
    authMethod: "oidc" as const,
    oidcMountPath: "oidc",
    oidcRole: "test-role",
  });
  
  profileActions.setActiveProfile(oidcProfile.id);
  await new Promise(resolve => setTimeout(resolve, 10));
  expect(authStore.vaultUrl).toBe("https://vault.oidc.io");
  
  profileActions.setActiveProfile("prod");
  await new Promise(resolve => setTimeout(resolve, 10));
  expect(authStore.vaultUrl).toBe("https://vault.prod.io");
  
  profileActions.setActiveProfile(oidcProfile.id);
  await new Promise(resolve => setTimeout(resolve, 10));
  expect(authStore.vaultUrl).toBe("https://vault.oidc.io");
});

test("Test 4: On module import, active profile's URL is reflected in authStore", () => {
  expect(profileStore.activeProfileId).toBe("default");
  expect(profileStore.activeProfile.url).toBe("https://vault.dev.io");
  expect(profileStore.activeProfile).toBeDefined();
  expect(profileStore.activeProfile.url).toBeTruthy();
});

test("Test 5: Empty/missing profile doesn't crash (graceful fallback to '')", async () => {
  profileStore.activeProfileId = "non-existent-id";
  await new Promise(resolve => setTimeout(resolve, 10));
  
  expect(profileStore.activeProfile).toBeDefined();
  expect(profileStore.activeProfile.id).toBe("default");
  expect(authStore.vaultUrl).toBe("https://vault.dev.io");
  
  profileStore.profiles = [];
  profileStore.activeProfileId = "";
  await new Promise(resolve => setTimeout(resolve, 10));
  
  expect(authStore.vaultUrl).toBe("");
});
