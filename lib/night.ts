// The day we started. Everything counts from here.
export const TOGETHER_SINCE = new Date(2025, 0, 1);

export function daysTogether(now = new Date()) {
  const start = Date.UTC(
    TOGETHER_SINCE.getFullYear(),
    TOGETHER_SINCE.getMonth(),
    TOGETHER_SINCE.getDate(),
  );
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((today - start) / 86_400_000);
}

// Bunnies curl up and sleep after 9pm
export function isNightNow() {
  const h = new Date().getHours();
  return h >= 21 || h <= 6;
}

// Small deterministic PRNG so decorative layouts match on server and client
export function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
