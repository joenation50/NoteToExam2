import type { Currency } from "./types";

export async function detectCurrency(): Promise<Currency> {
  try {
    const res = await fetch("https://www.cloudflare.com/cdn-cgi/trace", {
      cache: "no-store",
    });
    const text = await res.text();
    const line = text.split("\n").find((l) => l.startsWith("loc="));
    const loc = line ? line.slice(4).trim() : "";
    if (loc === "NG") return "NGN";
    if (loc) return "USD";
  } catch {
    /* fall through */
  }
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz === "Africa/Lagos") return "NGN";
    const lang = navigator.language || "";
    if (lang.toLowerCase().includes("-ng")) return "NGN";
  } catch {
    /* ignore */
  }
  return "USD";
}
