export type AuthMethod = "token" | "oidc";

export interface VaultProfile {
  id: string;
  name: string;
  url: string;
  token: string;
  authMethod: AuthMethod;
  oidcMountPath?: string;
  oidcRole?: string;
}

export interface TokenAuthConfig {
  token: string;
}

export interface OidcAuthConfig {
  mountPath: string;
  role: string;
}

export interface AuthFieldDef {
  key: string;
  label: string;
  type: "text" | "password";
  placeholder: string;
  defaultValue: string;
  required: boolean;
}

export interface AuthMethodDefinition {
  id: AuthMethod;
  label: string;
  description: string;
  fields: AuthFieldDef[];
}

export const AUTH_METHODS: AuthMethodDefinition[] = [
  {
    id: "token",
    label: "Token",
    description: "Authenticate using a Vault token",
    fields: [
      {
        key: "token",
        label: "Token",
        type: "password",
        placeholder: "Enter your Vault token",
        defaultValue: "",
        required: true,
      },
    ],
  },
  {
    id: "oidc",
    label: "OIDC",
    description: "Authenticate using OIDC",
    fields: [
      {
        key: "mount_path",
        label: "Mount Path",
        type: "text",
        placeholder: "oidc",
        defaultValue: "oidc",
        required: true,
      },
      {
        key: "role",
        label: "Role",
        type: "text",
        placeholder: "Enter your OIDC role",
        defaultValue: "",
        required: false,
      },
    ],
  },
];

export function migrateProfiles(profiles: any[]): VaultProfile[] {
  return profiles.map((profile) => {
    if (profile.authMethod) {
      return profile as VaultProfile;
    }
    return {
      ...profile,
      authMethod: "token" as const,
    };
  });
}
