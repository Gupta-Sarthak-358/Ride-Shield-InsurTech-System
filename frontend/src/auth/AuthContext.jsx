import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { authApi } from "../api/auth";

const SESSION_KEY = "rideshield.session_meta";

export function readStoredSessionMeta() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeStoredSessionMeta(meta) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(meta));
  } catch {
    // Storage unavailable
  }
}

export function clearStoredSessionMeta() {
  try {
    localStorage.removeItem(SESSION_KEY);
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

    async function restore() {
      try {
        const response = await authApi.me();
        if (!active) {
          return;
        }
        const next = { session: response.data.session };
        setSession(next);
        writeStoredSessionMeta(next);
      } catch {
        if (active) {
          setSession(null);
          clearStoredSessionMeta();
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
        const response = await authApi.workerLogin({ phone, password });
        const next = { session: response.data.session };
        setSession(next);
        writeStoredSessionMeta(next);
        return next;
      },
      async loginAdmin(username, password) {
        const response = await authApi.adminLogin({ username, password });
        const next = { session: response.data.session };
        setSession(next);
        writeStoredSessionMeta(next);
        return next;
      },
      async logout() {
        try {
          await authApi.logout();
        } catch {
          // cookie cleared by server
        }
        clearStoredSessionMeta();
        setSession(null);
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
