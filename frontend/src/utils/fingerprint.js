export function getDeviceFingerprint() {
  if (typeof window === "undefined") return "unknown-device";

  const nav = window.navigator || {};
  const screen = window.screen || {};

  const components = [
    nav.userAgent || "",
    nav.language || "",
    nav.hardwareConcurrency || "",
    nav.deviceMemory || "",
    screen.colorDepth || "",
    screen.width || "",
    screen.height || "",
    new Date().getTimezoneOffset()
  ].join("|");

  // Simple string hash function (djb2)
  let hash = 5381;
  for (let i = 0; i < components.length; i++) {
    hash = (hash * 33) ^ components.charCodeAt(i);
  }

  // return a hex string
  return `fp-${(hash >>> 0).toString(16)}`;
}
