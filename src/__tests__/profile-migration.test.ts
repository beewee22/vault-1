import { test, expect } from "bun:test";
import { migrateProfiles, VaultProfile } from "../types";

test("migrateProfiles: adds authMethod 'token' to old profiles without it", () => {
  const oldProfiles = [
    { id: "1", name: "Dev", url: "https://vault.dev.io", token: "abc123" },
    { id: "2", name: "Prod", url: "https://vault.prod.io", token: "xyz789" },
  ];

  const migrated = migrateProfiles(oldProfiles);

  expect(migrated).toHaveLength(2);
  expect(migrated[0]).toEqual({
    id: "1",
    name: "Dev",
    url: "https://vault.dev.io",
    token: "abc123",
    authMethod: "token",
  });
  expect(migrated[1]).toEqual({
    id: "2",
    name: "Prod",
    url: "https://vault.prod.io",
    token: "xyz789",
    authMethod: "token",
  });
});

test("migrateProfiles: is idempotent - already migrated profiles stay unchanged", () => {
  const alreadyMigrated: VaultProfile[] = [
    {
      id: "1",
      name: "Dev",
      url: "https://vault.dev.io",
      token: "abc123",
      authMethod: "token",
    },
  ];

  const migrated = migrateProfiles(alreadyMigrated);

  expect(migrated).toEqual(alreadyMigrated);
  expect(migrated[0].authMethod).toBe("token");
});

test("migrateProfiles: preserves OIDC profiles with oidcMountPath and oidcRole", () => {
  const mixedProfiles = [
    {
      id: "1",
      name: "Dev Token",
      url: "https://vault.dev.io",
      token: "abc123",
    },
    {
      id: "2",
      name: "Prod OIDC",
      url: "https://vault.prod.io",
      token: "",
      authMethod: "oidc" as const,
      oidcMountPath: "oidc",
      oidcRole: "my-role",
    },
  ];

  const migrated = migrateProfiles(mixedProfiles);

  expect(migrated).toHaveLength(2);
  // Old token profile gets authMethod added
  expect(migrated[0].authMethod).toBe("token");
  // OIDC profile is preserved exactly
  expect(migrated[1]).toEqual({
    id: "2",
    name: "Prod OIDC",
    url: "https://vault.prod.io",
    token: "",
    authMethod: "oidc",
    oidcMountPath: "oidc",
    oidcRole: "my-role",
  });
});

test("migrateProfiles: handles empty array", () => {
  const empty: any[] = [];
  const migrated = migrateProfiles(empty);
  expect(migrated).toEqual([]);
});

test("migrateProfiles: handles default profile structure", () => {
  const defaultProfile = [
    {
      id: "default",
      name: "Default",
      url: "https://vault.dev-mng-testbed.mng.musinsa.io",
      token: "",
    },
  ];

  const migrated = migrateProfiles(defaultProfile);

  expect(migrated).toHaveLength(1);
  expect(migrated[0]).toEqual({
    id: "default",
    name: "Default",
    url: "https://vault.dev-mng-testbed.mng.musinsa.io",
    token: "",
    authMethod: "token",
  });
});
