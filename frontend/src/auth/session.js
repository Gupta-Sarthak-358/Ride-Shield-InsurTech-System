const SESSION_META_KEY = "rideshield.session_meta";

export function readStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_META_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeStoredSession(value) {
  try {
    localStorage.setItem(SESSION_META_KEY, JSON.stringify(value));
  } catch {
    // Storage unavailable
  }
}

export function clearStoredSession() {
  try {
    localStorage.removeItem(SESSION_META_KEY);
  } catch {
    // Storage unavailable
  }
}

export function getStoredToken() {
  return null;
}
