/**
 * Vault KV V2 Path Transformation Utilities
 * 
 * Transforms mount paths to their respective API endpoint paths.
 * Pattern: "mount/path" → "mount/operation/path"
 */

/**
 * Transforms a Vault KV V2 mount path to its data endpoint path.
 * 
 * @param mountPath - The mount path (e.g., "secret/myapp/config")
 * @returns The data endpoint path (e.g., "secret/data/myapp/config")
 * 
 * @example
 * toDataPath("secret/myapp") // "secret/data/myapp"
 * toDataPath("secret/myapp/") // "secret/data/myapp"
 * toDataPath("secret") // "secret/data"
 */
export function toDataPath(mountPath: string): string {
  const cleaned = mountPath.endsWith("/") ? mountPath.slice(0, -1) : mountPath;
  const firstSlash = cleaned.indexOf("/");
  
  if (firstSlash === -1) {
    return `${cleaned}/data`;
  }
  
  const mount = cleaned.substring(0, firstSlash);
  const path = cleaned.substring(firstSlash + 1);
  return `${mount}/data/${path}`;
}

/**
 * Transforms a Vault KV V2 mount path to its metadata endpoint path.
 * 
 * @param mountPath - The mount path (e.g., "secret/myapp/config")
 * @returns The metadata endpoint path (e.g., "secret/metadata/myapp/config")
 * 
 * @example
 * toMetadataPath("secret/myapp") // "secret/metadata/myapp"
 * toMetadataPath("secret/myapp/") // "secret/metadata/myapp"
 * toMetadataPath("secret") // "secret/metadata"
 */
export function toMetadataPath(mountPath: string): string {
  const cleaned = mountPath.endsWith("/") ? mountPath.slice(0, -1) : mountPath;
  const firstSlash = cleaned.indexOf("/");
  
  if (firstSlash === -1) {
    return `${cleaned}/metadata`;
  }
  
  const mount = cleaned.substring(0, firstSlash);
  const path = cleaned.substring(firstSlash + 1);
  return `${mount}/metadata/${path}`;
}

/**
 * Transforms a Vault KV V2 mount path to its delete endpoint path.
 * 
 * @param mountPath - The mount path (e.g., "secret/myapp/config")
 * @returns The delete endpoint path (e.g., "secret/delete/myapp/config")
 * 
 * @example
 * toDeletePath("secret/myapp") // "secret/delete/myapp"
 * toDeletePath("secret/myapp/") // "secret/delete/myapp"
 * toDeletePath("secret") // "secret/delete"
 */
export function toDeletePath(mountPath: string): string {
  const cleaned = mountPath.endsWith("/") ? mountPath.slice(0, -1) : mountPath;
  const firstSlash = cleaned.indexOf("/");
  
  if (firstSlash === -1) {
    return `${cleaned}/delete`;
  }
  
  const mount = cleaned.substring(0, firstSlash);
  const path = cleaned.substring(firstSlash + 1);
  return `${mount}/delete/${path}`;
}

/**
 * Transforms a Vault KV V2 mount path to its undelete endpoint path.
 * 
 * @param mountPath - The mount path (e.g., "secret/myapp/config")
 * @returns The undelete endpoint path (e.g., "secret/undelete/myapp/config")
 * 
 * @example
 * toUndeletePath("secret/myapp") // "secret/undelete/myapp"
 * toUndeletePath("secret/myapp/") // "secret/undelete/myapp"
 * toUndeletePath("secret") // "secret/undelete"
 */
export function toUndeletePath(mountPath: string): string {
  const cleaned = mountPath.endsWith("/") ? mountPath.slice(0, -1) : mountPath;
  const firstSlash = cleaned.indexOf("/");
  
  if (firstSlash === -1) {
    return `${cleaned}/undelete`;
  }
  
  const mount = cleaned.substring(0, firstSlash);
  const path = cleaned.substring(firstSlash + 1);
  return `${mount}/undelete/${path}`;
}

/**
 * Transforms a Vault KV V2 mount path to its destroy endpoint path.
 * 
 * @param mountPath - The mount path (e.g., "secret/myapp/config")
 * @returns The destroy endpoint path (e.g., "secret/destroy/myapp/config")
 * 
 * @example
 * toDestroyPath("secret/myapp") // "secret/destroy/myapp"
 * toDestroyPath("secret/myapp/") // "secret/destroy/myapp"
 * toDestroyPath("secret") // "secret/destroy"
 */
export function toDestroyPath(mountPath: string): string {
  const cleaned = mountPath.endsWith("/") ? mountPath.slice(0, -1) : mountPath;
  const firstSlash = cleaned.indexOf("/");
  
  if (firstSlash === -1) {
    return `${cleaned}/destroy`;
  }
  
  const mount = cleaned.substring(0, firstSlash);
  const path = cleaned.substring(firstSlash + 1);
  return `${mount}/destroy/${path}`;
}

/**
 * Transforms a Vault KV V2 mount path to its list endpoint path.
 * 
 * LIST operations use the metadata endpoint in Vault KV V2.
 * 
 * @param mountPath - The mount path (e.g., "secret/myapp/config")
 * @returns The list endpoint path (e.g., "secret/metadata/myapp/config")
 * 
 * @example
 * toListPath("secret/myapp") // "secret/metadata/myapp"
 * toListPath("secret/myapp/") // "secret/metadata/myapp"
 * toListPath("secret") // "secret/metadata"
 */
export function toListPath(mountPath: string): string {
  // LIST uses metadata endpoint
  return toMetadataPath(mountPath);
}
