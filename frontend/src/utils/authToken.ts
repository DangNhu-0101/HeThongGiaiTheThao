type PersistedAuthStorage = {
  state?: {
    accessToken?: string | null;
  };
  accessToken?: string | null;
};

const isUsableToken = (token?: string | null) => Boolean(token && token !== "null" && token !== "undefined");

export const getStoredAccessToken = () => {
  const directToken = localStorage.getItem("token") || localStorage.getItem("accessToken");
  if (isUsableToken(directToken)) return directToken;

  const persistedAuth = localStorage.getItem("auth-storage");
  if (!persistedAuth) return null;

  try {
    const parsed = JSON.parse(persistedAuth) as PersistedAuthStorage;
    const persistedToken = parsed.state?.accessToken || parsed.accessToken;
    return isUsableToken(persistedToken) ? persistedToken : null;
  } catch {
    return null;
  }
};

export const setStoredAccessToken = (token: string) => {
  localStorage.setItem("token", token);
  localStorage.setItem("accessToken", token);
};

export const clearStoredAuthTokens = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};
