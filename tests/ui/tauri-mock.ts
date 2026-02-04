import type { Page } from "@playwright/test";

declare global {
  interface Window {
    __TAURI__?: {
      invoke: (command: string, args?: unknown) => Promise<unknown>;
    };
    __TAURI_INTERNALS__?: {
      invoke?: (command: string, args?: unknown, options?: unknown) => Promise<unknown>;
      transformCallback?: (callback: unknown, once?: boolean) => number;
      unregisterCallback?: (id?: number) => void;
      runCallback?: (id?: number, data?: unknown) => void;
    };
    __TAURI_EVENT_PLUGIN_INTERNALS__?: Record<string, unknown>;
  }
}

type MockData = {
  mounts?: Record<string, { type: string; description?: string }>;
  lists?: Record<string, string[]>;
  secrets?: Record<string, Record<string, unknown>>;
  policies?: string[];
};

const defaultData: Required<MockData> = {
  mounts: {
    "secret/": { type: "kv", description: "Secret Engine" },
    "kv/": { type: "kv-v2", description: "Key/Value" },
  },
  lists: {
    "secret/metadata/": ["app/", "config"],
    "secret/metadata/app/": ["db"],
  },
  secrets: {
    "secret/data/config": { username: "admin", env: "prod" },
    "secret/data/app/db": { password: "hunter2" },
  },
  policies: ["default", "dev"],
};

export async function installTauriMock(page: Page, data: MockData = {}) {
  const merged = {
    mounts: { ...defaultData.mounts, ...data.mounts },
    lists: { ...defaultData.lists, ...data.lists },
    secrets: { ...defaultData.secrets, ...data.secrets },
    policies: data.policies || defaultData.policies,
  };

  await page.addInitScript(({ payload }) => {
    localStorage.clear();

    const respond = (command: string, args?: any) => {
      if (command === "fetch_vault_secret") {
        if (args?.path === "sys/mounts") {
          return { data: payload.mounts };
        }

        const secretData = payload.secrets[args?.path] || {};
        return { data: { data: secretData } };
      }

      if (command === "list_vault_secrets") {
        const keys = payload.lists[args?.path] || [];
        return { data: { keys } };
      }

      if (command === "list_vault_policies") {
        return { data: { keys: payload.policies } };
      }

      if (command === "check_vault_connection") {
        return { ok: true };
      }

      if (command === "save_vault_token") {
        return { ok: true };
      }

      if (command === "read_vault_policy") {
        return { data: { rules: "path \"secret/*\" { capabilities = [\"read\"] }" } };
      }

      return {};
    };

    window.__TAURI_INTERNALS__ = window.__TAURI_INTERNALS__ || {};
    window.__TAURI_EVENT_PLUGIN_INTERNALS__ = window.__TAURI_EVENT_PLUGIN_INTERNALS__ || {};

    window.__TAURI_INTERNALS__.invoke = async (command: string, args?: unknown) => respond(command, args);
    window.__TAURI_INTERNALS__.transformCallback = () => 0;
    window.__TAURI_INTERNALS__.unregisterCallback = () => {};
    window.__TAURI_INTERNALS__.runCallback = () => {};

    window.__TAURI__ = {
      invoke: async (command: string, args?: unknown) => respond(command, args),
    };
  }, { payload: merged });
}

export async function stabilizeUi(page: Page) {
  await page.addStyleTag({
    content: `* {
      animation-duration: 0s !important;
      animation-delay: 0s !important;
      transition-duration: 0s !important;
      caret-color: transparent !important;
    }`,
  });
}
