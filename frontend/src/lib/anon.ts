// Stable anonymous id so mentor telemetry/rate-limit works before login.
const KEY = "pkh-anon-id";

export function getAnonId(): string {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id =
      (crypto.randomUUID && crypto.randomUUID()) ||
      `a_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}
