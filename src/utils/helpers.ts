import type { DexPair } from "../types/token";
import { PROJECT_CONFIG } from "../config/project";

export function num(n: unknown): number | null {
  if (n == null || isNaN(Number(n))) return null;
  return Number(n);
}

export function money(n: unknown): string {
  const v = num(n);
  if (v == null) return "—";
  const a = Math.abs(v);
  if (a >= 1e9) return "$" + (v / 1e9).toFixed(2) + "B";
  if (a >= 1e6) return "$" + (v / 1e6).toFixed(2) + "M";
  if (a >= 1e3) return "$" + (v / 1e3).toFixed(1) + "K";
  return "$" + v.toFixed(0);
}

export function price(p: unknown): string {
  const v = num(p);
  if (v == null) return "—";
  if (v >= 1) return "$" + v.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (v >= 0.0001) return "$" + v.toPrecision(4);
  const s = v.toExponential(2).split("e-"); // e.g. 1.23e-7
  const zeros = Number(s[1]) - 1;
  return "$0.0<sub>" + zeros + "</sub>" + s[0].replace(".", "").slice(0, 4);
}

export function pctFormatted(v: unknown): { text: string; className: string } {
  const n = num(v);
  if (n == null) return { text: "—", className: "" };
  const c = n >= 0 ? "up" : "down";
  const val = `${n >= 0 ? "+" : ""}${Math.abs(n) >= 1000 ? Math.round(n).toLocaleString() : n.toFixed(1)}%`;
  return { text: val, className: c };
}

export function age(ts: number | null | undefined): string {
  if (!ts) return "—";
  const m = (Date.now() - ts) / 60000;
  if (m < 60) return Math.max(1, Math.round(m)) + "m";
  if (m < 1440) return Math.round(m / 60) + "h";
  if (m < 43200) return Math.round(m / 1440) + "d";
  return Math.round(m / 43200) + "mo";
}

export function heatOf(p: DexPair): number {
  const vol = num(p.volume?.h24) || 0;
  const liq = num(p.liquidity?.usd) || 0;
  const b = num(p.txns?.h1?.buys) || 0;
  const s = num(p.txns?.h1?.sells) || 0;
  const chg = Math.max(-50, Math.min(200, num(p.priceChange?.h1) || 0));
  const turnover = Math.min(1, vol / Math.max(liq, 1000));
  const buyRatio = b + s ? b / (b + s) : 0.5;
  const move = Math.min(1, Math.max(0, (chg + 20) / 100));
  const activity = Math.min(1, Math.log10(b + s + 1) / 2.5);
  const depth = Math.min(1, Math.log10(liq + 1) / 4); // thin pools get damped
  return Math.round((35 * turnover + 25 * buyRatio + 20 * move + 20 * activity) * (0.5 + 0.5 * depth));
}

export const sym = (p: DexPair): string =>
  String(p.baseToken?.symbol || "?").replace(/^\$+/, "");

export function getFlags(p: DexPair): Array<{ label: string; className: string }> {
  const f: Array<{ label: string; className: string }> = [];
  const liq = num(p.liquidity?.usd) || 0;
  const b = num(p.txns?.h1?.buys) || 0;
  const s = num(p.txns?.h1?.sells) || 0;
  if (p.pairCreatedAt && Date.now() - p.pairCreatedAt < 6 * 3600e3) {
    f.push({ label: "NEW", className: "flag new" });
  }
  if (liq < 5000) {
    f.push({ label: "LOW LIQ", className: "flag low" });
  }
  if (s > 4 && s > b * 2) {
    f.push({ label: "HEAVY SELLS", className: "flag dump" });
  }
  return f;
}

export function isOfficial(k: string): boolean {
  return (
    !!PROJECT_CONFIG.glightCa &&
    k.toLowerCase() === PROJECT_CONFIG.glightCa.toLowerCase()
  );
}

let audioCtx: AudioContext | null = null;
export function playAlertSound(): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!audioCtx) audioCtx = new AudioCtx();
    const c = audioCtx;
    const t = c.currentTime;
    [880, 1320].forEach((f, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.12, t + i * 0.12 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.12 + 0.18);
      o.connect(g);
      g.connect(c.destination);
      o.start(t + i * 0.12);
      o.stop(t + i * 0.12 + 0.2);
    });
  } catch {
    // Audio context may be restricted before user gesture
  }
}
