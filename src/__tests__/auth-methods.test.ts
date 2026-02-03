import { test, expect } from "bun:test";
import {
  AUTH_METHODS,
  AuthMethodDefinition,
  AuthFieldDef,
  TokenAuthConfig,
  OidcAuthConfig,
} from "../types";

test("AUTH_METHODS is defined and is an array", () => {
  expect(Array.isArray(AUTH_METHODS)).toBe(true);
  expect(AUTH_METHODS.length).toBeGreaterThan(0);
});

test("AUTH_METHODS has token and oidc methods", () => {
  const methodIds = AUTH_METHODS.map((m) => m.id);
  expect(methodIds).toContain("token");
  expect(methodIds).toContain("oidc");
});

test("Each auth method has required properties", () => {
  AUTH_METHODS.forEach((method: AuthMethodDefinition) => {
    expect(method.id).toBeDefined();
    expect(method.label).toBeDefined();
    expect(method.description).toBeDefined();
    expect(Array.isArray(method.fields)).toBe(true);
    expect(method.fields.length).toBeGreaterThan(0);
  });
});

test("Token method has password-type field for token", () => {
  const tokenMethod = AUTH_METHODS.find((m) => m.id === "token");
  expect(tokenMethod).toBeDefined();

  const tokenField = tokenMethod!.fields.find((f) => f.key === "token");
  expect(tokenField).toBeDefined();
  expect(tokenField!.type).toBe("password");
  expect(tokenField!.required).toBe(true);
});

test("OIDC method has mount_path field with default value", () => {
  const oidcMethod = AUTH_METHODS.find((m) => m.id === "oidc");
  expect(oidcMethod).toBeDefined();

  const mountPathField = oidcMethod!.fields.find((f) => f.key === "mount_path");
  expect(mountPathField).toBeDefined();
  expect(mountPathField!.defaultValue).toBe("oidc");
  expect(mountPathField!.type).toBe("text");
});

test("OIDC method has role field", () => {
  const oidcMethod = AUTH_METHODS.find((m) => m.id === "oidc");
  expect(oidcMethod).toBeDefined();

  const roleField = oidcMethod!.fields.find((f) => f.key === "role");
  expect(roleField).toBeDefined();
  expect(roleField!.type).toBe("text");
});

test("AuthFieldDef has all required properties", () => {
  AUTH_METHODS.forEach((method) => {
    method.fields.forEach((field: AuthFieldDef) => {
      expect(field.key).toBeDefined();
      expect(field.label).toBeDefined();
      expect(field.type).toBeDefined();
      expect(["text", "password"]).toContain(field.type);
      expect(field.placeholder).toBeDefined();
      expect(field.defaultValue).toBeDefined();
      expect(typeof field.required).toBe("boolean");
    });
  });
});

test("TokenAuthConfig interface is valid", () => {
  const config: TokenAuthConfig = {
    token: "test-token",
  };
  expect(config.token).toBe("test-token");
});

test("OidcAuthConfig interface is valid", () => {
  const config: OidcAuthConfig = {
    mountPath: "oidc",
    role: "test-role",
  };
  expect(config.mountPath).toBe("oidc");
  expect(config.role).toBe("test-role");
});
