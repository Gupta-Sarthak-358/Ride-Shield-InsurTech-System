/**
 * Returns Tailwind class strings for disruption-level styling.
 *
 * Used in Dashboard nearbyAlerts, AdminPanel forecast rows, and any
 * component that needs colour-coded severity indicators.
 *
 * @param {number} level - disruption_score value between 0 and 1
 * @returns {{ border: string, progress: string, pill: string }}
 */
export function getDisruptionTone(level) {
  if (level >= 0.7) {
    return {
      border: "border-l-red-600 bg-red-50/50",
      progress: "bg-red-600",
      pill: "bg-red-100 text-red-900",
    };
  }
  if (level >= 0.4) {
    return {
      border: "border-l-amber-600 bg-amber-50/50",
      progress: "bg-amber-600",
      pill: "bg-amber-100 text-amber-900",
    };
  }
  return {
    border: "border-l-blue-600 bg-blue-50/50",
    progress: "bg-blue-600",
    pill: "bg-blue-100 text-blue-900",
  };
}
