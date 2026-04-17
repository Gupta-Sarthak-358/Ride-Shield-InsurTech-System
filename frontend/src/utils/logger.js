/**
 * Local-First Observability Logger
 *
 * Captures structured error payloads for UX telemetry.
 * Browser console output stays silent in production.
 */

export function logError({ code, route, isDuplicate, severity, details }) {
  const payload = {
    code,
    route,
    isDuplicate,
    severity,
    ts: new Date().toISOString(),
    ...(details && { details }),
  };

  if (isDuplicate) return;
  if (import.meta.env.MODE !== "development") return;

  console.error(`[RideShield Error] ${code}`, JSON.stringify(payload, null, 2));
}

export function logInfo(message, data) {
  if (import.meta.env.MODE !== "development") return;
  console.log(`[RideShield] ${message}`, data || "");
}

export function logWarning(message, data) {
  if (import.meta.env.MODE !== "development") return;
  console.warn(`[RideShield Warning] ${message}`, data || "");
}
