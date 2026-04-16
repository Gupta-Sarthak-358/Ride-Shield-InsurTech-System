import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import toast from "react-hot-toast";

import { authApi } from "../api/auth";
import { setAuthToken } from "../api/client";
import { getDeviceFingerprint } from "../utils/fingerprint";
import i18n from "../i18n/config";

const SESSION_KEY = "rideshield.session_meta";
const LEGACY_WORKER_ID_KEY = "rideshield.workerId";
const SESSION_TOKEN_KEY = "rideshield.session_token";
const SESSION_EXPIRY_KEY = "rideshield.session_expiry";

export function sanitizeSessionMeta(meta) {
  const role = meta?.session?.role;
  return role ? { session: { role } } : null;
}

export function isSessionExpiredLocally() {
  try {
    const expiry = localStorage.getItem(SESSION_EXPIRY_KEY);
    if (!expiry) {
      return null;
    }
    const expiryTime = new Date(expiry).getTime();
    const now = Date.now();
    const bufferMs = 5 * 60 * 1000;
    return now > expiryTime - bufferMs;
  } catch {
    return null;
  }
}

export function readStoredSessionMeta() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? sanitizeSessionMeta(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function writeStoredSessionMeta(meta) {
  try {
    const sanitized = sanitizeSessionMeta(meta);
    if (!sanitized) {
      clearStoredSessionMeta();
      return;
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(sanitized));
    localStorage.removeItem(LEGACY_WORKER_ID_KEY);
  } catch {
    // Storage unavailable
  }
}

export function clearStoredSessionMeta() {
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(LEGACY_WORKER_ID_KEY);
    localStorage.removeItem(SESSION_EXPIRY_KEY);
  } catch {
    // Storage unavailable
  }
}

export function readStoredSessionToken() {
  try {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function writeStoredSessionToken(token) {
  setAuthToken(token || null);
  try {
    if (token) {
      localStorage.setItem(SESSION_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(SESSION_TOKEN_KEY);
    }
  } catch {
    // Storage unavailable
  }
}

export function clearStoredSessionToken() {
  setAuthToken(null);
  try {
    localStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {
    // Storage unavailable
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readStoredSessionMeta());
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let active = true;
    const expired = isSessionExpiredLocally();
    if (expired === true) {
      clearStoredSessionMeta();
      clearStoredSessionToken();
      setSession(null);
      setBooting(false);
      if (active) {
        toast.error(i18n?.t?.("auth.errors.session_expired") || "Your session has expired. Please sign in again.");
      }
      return;
    }

    const stored = readStoredSessionMeta();
    const storedToken = readStoredSessionToken();
    if (stored) {
      writeStoredSessionMeta(stored);
    } else {
      clearStoredSessionMeta();
    }
    setAuthToken(storedToken);

    async function restore() {
      try {
        const response = await authApi.me();
        if (!active) {
          return;
        }
        const next = { session: response.data.session };
        setSession(next);
        writeStoredSessionMeta(next);
        if (response.data.session?.exp) {
          localStorage.setItem(SESSION_EXPIRY_KEY, response.data.session.exp);
        }
      } catch (error) {
        if (active) {
          setSession(null);
          clearStoredSessionMeta();
          clearStoredSessionToken();
          if (error?.response?.status !== 401) {
            toast.error("Session could not be restored. Please sign in again.");
          }
        }
      } finally {
        if (active) {
          setBooting(false);
        }
      }
    }

    restore();
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      booting,
      session,
      isAuthenticated: Boolean(session?.session),
      role: session?.session?.role || null,
      async loginWorker(phone, password) {
        const device_fingerprint = getDeviceFingerprint();
        const response = await authApi.workerLogin({ phone, password, device_fingerprint });
        const next = { session: response.data.session };
        flushSync(() => {
          setSession(next);
        });
        writeStoredSessionMeta(next);
        writeStoredSessionToken(response.data.token);
        if (response.data.session?.exp) {
          localStorage.setItem(SESSION_EXPIRY_KEY, response.data.session.exp);
        }
        return next;
      },
      async loginAdmin(username, password) {
        const response = await authApi.adminLogin({ username, password });
        const next = { session: response.data.session };
        flushSync(() => {
          setSession(next);
        });
        writeStoredSessionMeta(next);
        writeStoredSessionToken(response.data.token);
        if (response.data.session?.exp) {
          localStorage.setItem(SESSION_EXPIRY_KEY, response.data.session.exp);
        }
        return next;
      },
      async logout() {
        try {
          await authApi.logout();
        } catch {
          // cookie cleared by server
        }
        clearStoredSessionMeta();
        clearStoredSessionToken();
        flushSync(() => {
          setSession(null);
        });
        if (i18n && typeof i18n.changeLanguage === "function") {
          i18n.changeLanguage("en");
        }
      },
    }),
    [booting, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
