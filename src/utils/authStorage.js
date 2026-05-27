const AUTH_STORAGE_KEYS = ["user_id", "username", "email", "role", "token"];

const hasWindow = () => typeof window !== "undefined";
const INVALID_AUTH_VALUES = new Set(["", "null", "undefined", "NaN"]);

const normalizeAuthValue = (value) => {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  if (INVALID_AUTH_VALUES.has(normalized)) return null;
  return normalized;
};

export const getAuthItem = (key) => {
  if (!hasWindow()) return null;

  const scopedValue = normalizeAuthValue(window.sessionStorage.getItem(key));
  if (scopedValue !== null) return scopedValue;

  return normalizeAuthValue(window.localStorage.getItem(key));
};

export const setAuthItem = (key, value) => {
  if (!hasWindow()) return;
  const normalized = normalizeAuthValue(value);
  if (normalized === null) return;

  window.sessionStorage.setItem(key, normalized);
  window.localStorage.setItem(key, normalized);
};

export const setAuthSession = (auth = {}) => {
  AUTH_STORAGE_KEYS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(auth, key)) {
      setAuthItem(key, auth[key]);
    }
  });
};

export const clearAuthSession = () => {
  if (!hasWindow()) return;

  AUTH_STORAGE_KEYS.forEach((key) => {
    window.sessionStorage.removeItem(key);
    window.localStorage.removeItem(key);
  });
};

export const hydrateAuthSessionFromLegacy = () => {
  if (!hasWindow()) return;

  const hasScopedAuth = AUTH_STORAGE_KEYS.some(
    (key) => window.sessionStorage.getItem(key) !== null
  );

  if (hasScopedAuth) return;

  AUTH_STORAGE_KEYS.forEach((key) => {
    const legacyValue = window.localStorage.getItem(key);
    const normalized = normalizeAuthValue(legacyValue);
    if (normalized !== null) {
      window.sessionStorage.setItem(key, normalized);
    }
  });
};
