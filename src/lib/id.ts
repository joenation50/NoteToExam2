export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36)}`;
}

export function deviceId() {
  const key = "nte_device";
  let d = localStorage.getItem(key);
  if (!d) {
    d = uid("dev");
    localStorage.setItem(key, d);
  }
  return d;
}

export function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function startOfDay(ts = Date.now()) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function referralCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function clampText(s: string, n: number) {
  if (s.length <= n) return s;
  return s.slice(0, n);
}
