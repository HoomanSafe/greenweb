import React from "react";
import type { DexPair, RadarAlertItem } from "./types/token";
import { SEED_TOKENS } from "./data/seedTokens";
import { PROJECT_CONFIG } from "./config/project";
import {
  heatOf,
  num,
  money,
  age,
  pctFormatted,
  sym,
  playAlertSound,
} from "./utils/helpers";
import { Navbar } from "./components/Navbar";
import { Ticker } from "./components/Ticker";
import { Hero } from "./components/Hero";
import { LiveBoard } from "./components/LiveBoard";
import { Leaderboard } from "./components/Leaderboard";
import { HowItWorks } from "./components/HowItWorks";
import { TokenSection } from "./components/TokenSection";
import { Footer } from "./components/Footer";
import { TradeModal } from "./components/TradeModal";
import { DetailModal } from "./components/DetailModal";
import { AlertStack } from "./components/AlertStack";
import { Toast } from "./components/Toast";

const API = "https://api.dexscreener.com";
const CHAIN = "robinhood";
const SKIP = new Set(["WETH", "ETH", "USDC", "USDT", "USDG", "USD", "WBTC"]);
const SEARCHES = [
  "robinhood",
  "hood",
  "weth",
  "usdg",
  "usdc",
  "ai",
  "meme",
  "pepe",
  "doge",
  "cat",
  "moon",
  "agent",
];

interface AlertsConfigState {
  on: boolean;
  alertNew: boolean;
  alertHeat: boolean;
  heatThreshold: number;
  alertPump: boolean;
  pumpThreshold: number;
  alertDump: boolean;
  sound: boolean;
}

export default function App() {
  const [tokensMap, setTokensMap] = React.useState<Map<string, DexPair>>(() => {
    const map = new Map<string, DexPair>();
    try {
      const c = JSON.parse(localStorage.getItem("gl_cache") || "null");
      if (c && Date.now() - c.t < 10 * 60e3 && Array.isArray(c.d)) {
        for (const p of c.d) {
          if (p?.baseToken?.address) {
            map.set(p.baseToken.address.toLowerCase(), p);
          }
        }
      }
    } catch {
      // ignore
    }
    if (map.size === 0) {
      for (const p of SEED_TOKENS) {
        if (p?.baseToken?.address) {
          map.set(p.baseToken.address.toLowerCase(), p);
        }
      }
    }
    return map;
  });

  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [lastUpdatedText, setLastUpdatedText] = React.useState<string>("Scanning Robinhood Chain…");

  // Watchlist state
  const [watchlist, setWatchlist] = React.useState<Set<string>>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("gl_watch") || "[]");
      return new Set(Array.isArray(saved) ? saved : []);
    } catch {
      return new Set();
    }
  });

  // Alerts configuration state
  const [alertsConfig, setAlertsConfig] = React.useState<AlertsConfigState>(() => {
    const defaults: AlertsConfigState = {
      on: true,
      alertNew: true,
      alertHeat: true,
      heatThreshold: 75,
      alertPump: true,
      pumpThreshold: 25,
      alertDump: false,
      sound: true,
    };
    try {
      const saved = JSON.parse(localStorage.getItem("gl_alerts") || "null");
      if (saved) return { ...defaults, ...saved };
    } catch {
      // ignore
    }
    return defaults;
  });

  const [alertFeed, setAlertFeed] = React.useState<RadarAlertItem[]>([]);
  const [floatingCards, setFloatingCards] = React.useState<RadarAlertItem[]>([]);
  const [unreadAlerts, setUnreadAlerts] = React.useState<number>(0);
  const [isAlertsOpen, setIsAlertsOpen] = React.useState<boolean>(false);

  // Modals state
  const [tradeTokenKey, setTradeTokenKey] = React.useState<string | null>(null);
  const [detailTokenKey, setDetailTokenKey] = React.useState<string | null>(null);

  // Toast state
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // History tracking for heat
  const heatHistoryRef = React.useRef<Map<string, number[]>>(new Map());
  const prevTokensRef = React.useRef<Map<string, DexPair> | null>(null);
  const alertSeenRef = React.useRef<Map<string, number>>(new Map());

  // Show toast notification
  const showToast = React.useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 1500);
  }, []);

  // Copy text helper
  const handleCopy = React.useCallback(
    (txt: string) => {
      if (!txt) {
        showToast("Contract coming soon");
        return;
      }
      const msg = txt.length > 60 ? "Copied" : "Contract copied";
      if (navigator.clipboard?.writeText) {
        navigator.clipboard
          .writeText(txt)
          .then(() => showToast(msg))
          .catch(() => {
            const ta = document.createElement("textarea");
            ta.value = txt;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            ta.remove();
            showToast(msg);
          });
      } else {
        const ta = document.createElement("textarea");
        ta.value = txt;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        showToast(msg);
      }
    },
    [showToast]
  );

  // Watchlist toggle
  const toggleWatchlist = React.useCallback(
    (key: string) => {
      setWatchlist((prev) => {
        const next = new Set(prev);
        const lower = key.toLowerCase();
        if (next.has(lower)) {
          next.delete(lower);
          showToast("Removed from watchlist");
        } else {
          next.add(lower);
          showToast("Added to watchlist");
        }
        try {
          localStorage.setItem("gl_watch", JSON.stringify([...next]));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [showToast]
  );

  // Alerts config update
  const updateAlertsConfig = React.useCallback((updates: Partial<AlertsConfigState>) => {
    setAlertsConfig((prev: AlertsConfigState) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem("gl_alerts", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const triggerAlert = React.useCallback(
    (p: DexPair, emoji: string, title: string, detail: string) => {
      const key = (p.baseToken?.address || "").toLowerCase();
      const now = Date.now();
      const last = alertSeenRef.current.get(key + title);
      if (last && now - last < 10 * 60e3) return;
      alertSeenRef.current.set(key + title, now);

      const item: RadarAlertItem = {
        id: `${key}-${title}-${now}`,
        key,
        emoji,
        title,
        detail,
        sym: sym(p),
        t: now,
      };

      setAlertFeed((prev) => [item, ...prev.slice(0, 29)]);
      if (!isAlertsOpen) {
        setUnreadAlerts((prev) => prev + 1);
      }

      setFloatingCards((prev) => [item, ...prev.slice(0, 2)]);
      setTimeout(() => {
        setFloatingCards((prev) => prev.filter((c) => c.id !== item.id));
      }, 9000);

      if (alertsConfig.sound) {
        playAlertSound();
      }

      try {
        if (
          document.hidden &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          new Notification(`${emoji} $${item.sym} · ${title}`, {
            body: detail.replace(/<[^>]+>/g, ""),
            tag: key + title,
          });
        }
      } catch {
        // ignore
      }
    },
    [alertsConfig.sound, isAlertsOpen]
  );

  const checkAlerts = React.useCallback(
    (currentMap: Map<string, DexPair>) => {
      if (!prevTokensRef.current) {
        prevTokensRef.current = currentMap;
        return;
      }
      if (!alertsConfig.on) {
        prevTokensRef.current = currentMap;
        return;
      }

      const prevMap = prevTokensRef.current;
      const hv = alertsConfig.heatThreshold || 75;
      const pv = alertsConfig.pumpThreshold || 25;

      for (const [k, p] of currentMap) {
        const o = prevMap.get(k);
        const liq = num(p.liquidity?.usd) || 0;
        const curHeat = heatOf(p);

        if (!o) {
          if (alertsConfig.alertNew) {
            triggerAlert(
              p,
              "🌱",
              "New on radar",
              `${money(liq)} liquidity · ${age(p.pairCreatedAt)} old`
            );
          }
          continue;
        }

        const prevHeat = heatOf(o);
        if (alertsConfig.alertHeat && prevHeat < hv && curHeat >= hv) {
          triggerAlert(
            p,
            "🔥",
            "Heating up",
            `Heat ${prevHeat} → <b style="color:var(--lime)">${curHeat}</b>`
          );
        }

        const c1 = num(p.priceChange?.h1);
        const c0 = num(o.priceChange?.h1);
        if (
          alertsConfig.alertPump &&
          c1 != null &&
          c1 >= pv &&
          (c0 == null || c0 < pv)
        ) {
          triggerAlert(
            p,
            "🚀",
            "Pumping",
            `${pctFormatted(c1).text} in the last hour`
          );
        }

        const b = num(p.txns?.h1?.buys) || 0;
        const sl = num(p.txns?.h1?.sells) || 0;
        const ob = num(o.txns?.h1?.buys) || 0;
        const os = num(o.txns?.h1?.sells) || 0;
        if (
          alertsConfig.alertDump &&
          sl > 4 &&
          sl > b * 2 &&
          !(os > 4 && os > ob * 2)
        ) {
          triggerAlert(
            p,
            "⚠️",
            "Heavy selling",
            `${sl} sells vs ${b} buys (1h)`
          );
        }
      }

      prevTokensRef.current = currentMap;
    },
    [alertsConfig, triggerAlert]
  );

  // DexScreener loading function
  const loadTokens = React.useCallback(async () => {
    setIsLoading(true);
    setLastUpdatedText("Scanning Robinhood Chain…");

    try {
      const getJSON = async (url: string) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch");
        return await res.json();
      };

      const collectedAddrs: string[] = [];
      const newMap = new Map<string, DexPair>(tokensMap);

      const addPairs = (pairs: DexPair[]) => {
        for (const p of pairs || []) {
          if (!p || p.chainId !== CHAIN || !p.baseToken?.address) continue;
          if (SKIP.has((p.baseToken.symbol || "").toUpperCase())) continue;
          const key = p.baseToken.address.toLowerCase();
          const prev = newMap.get(key);
          if (!prev || (num(p.liquidity?.usd) || 0) > (num(prev.liquidity?.usd) || 0)) {
            const created = Math.min(
              p.pairCreatedAt || Infinity,
              prev?.pairCreatedAt || Infinity
            );
            newMap.set(key, {
              ...p,
              pairCreatedAt: isFinite(created) ? created : undefined,
            });
          }
        }
      };

      const feeds = [
        "/token-profiles/latest/v1",
        "/token-boosts/latest/v1",
        "/token-boosts/top/v1",
        "/community-takeovers/latest/v1",
      ];

      const feedJobs = feeds.map((f) =>
        getJSON(API + f)
          .then((list) => {
            (Array.isArray(list) ? list : []).forEach(
              (t: { chainId?: string; tokenAddress?: string }) => {
                if (t.chainId === CHAIN && t.tokenAddress) {
                  collectedAddrs.push(t.tokenAddress);
                }
              }
            );
          })
          .catch(() => {})
      );

      const searchJobs = SEARCHES.map((q) =>
        getJSON(`${API}/latest/dex/search?q=${encodeURIComponent(q)}`)
          .then((d) => addPairs(d.pairs))
          .catch(() => {})
      );

      await Promise.all([...feedJobs, ...searchJobs]);

      if (PROJECT_CONFIG.glightCa) {
        collectedAddrs.push(PROJECT_CONFIG.glightCa);
      }

      // Batch fetch tokens
      const uniq = [...new Set(collectedAddrs.map((a) => a.toLowerCase()))];
      for (let i = 0; i < uniq.length; i += 30) {
        try {
          const batch = uniq.slice(i, i + 30).join(",");
          const data = await getJSON(`${API}/tokens/v1/${CHAIN}/${batch}`);
          addPairs(Array.isArray(data) ? data : data.pairs || []);
        } catch {
          // ignore
        }
      }

      // Record heat history
      for (const [k, p] of newMap) {
        const hist = heatHistoryRef.current.get(k) || [];
        hist.push(heatOf(p));
        if (hist.length > 40) hist.shift();
        heatHistoryRef.current.set(k, hist);
      }

      checkAlerts(newMap);
      setTokensMap(new Map(newMap));

      try {
        localStorage.setItem(
          "gl_cache",
          JSON.stringify({ t: Date.now(), d: [...newMap.values()] })
        );
      } catch {
        // ignore
      }

      setLastUpdatedText(
        "Updated " +
          new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    } catch {
      setLastUpdatedText("Scan completed");
    } finally {
      setIsLoading(false);
    }
  }, [tokensMap, checkAlerts]);

  // Initial load and periodic refresh
  React.useEffect(() => {
    loadTokens();
    const interval = setInterval(loadTokens, 30000);
    return () => clearInterval(interval);
  }, []);

  const tokensList = React.useMemo(() => {
    return [...tokensMap.values()];
  }, [tokensMap]);

  const selectedTradeToken = tradeTokenKey
    ? tokensMap.get(tradeTokenKey.toLowerCase()) || null
    : null;

  const selectedDetailToken = detailTokenKey
    ? tokensMap.get(detailTokenKey.toLowerCase()) || null
    : null;

  return (
    <>
      <Navbar />
      <Ticker tokens={tokensList} />
      <Hero
        tokens={tokensList}
        onSelectToken={(address) => setDetailTokenKey(address)}
      />

      <LiveBoard
        tokens={tokensList}
        isLoading={isLoading}
        lastUpdatedText={lastUpdatedText}
        onRefresh={loadTokens}
        watchlist={watchlist}
        onToggleWatchlist={toggleWatchlist}
        onOpenTrade={(k) => {
          setDetailTokenKey(null);
          setTradeTokenKey(k);
        }}
        onOpenDetail={(k) => setDetailTokenKey(k)}
        onCopy={handleCopy}
        alertsConfig={alertsConfig}
        onUpdateAlertsConfig={updateAlertsConfig}
        alertFeed={alertFeed}
        onClearAlertFeed={() => setAlertFeed([])}
        unreadAlerts={unreadAlerts}
        isAlertsOpen={isAlertsOpen}
        onToggleAlerts={() => {
          setIsAlertsOpen((prev) => {
            if (!prev) setUnreadAlerts(0);
            return !prev;
          });
        }}
        onCloseAlerts={() => setIsAlertsOpen(false)}
        onShowToast={showToast}
      />

      <Leaderboard
        tokens={tokensList}
        onOpenTrade={(k) => {
          setDetailTokenKey(null);
          setTradeTokenKey(k);
        }}
        onOpenDetail={(k) => setDetailTokenKey(k)}
        onCopy={handleCopy}
      />

      <HowItWorks />
      <TokenSection onCopy={handleCopy} />
      <Footer />

      {/* Trade Modal */}
      <TradeModal
        token={selectedTradeToken}
        onClose={() => setTradeTokenKey(null)}
        onCopy={handleCopy}
      />

      {/* Detail Modal */}
      <DetailModal
        token={selectedDetailToken}
        onClose={() => setDetailTokenKey(null)}
        onTrade={(k) => {
          setDetailTokenKey(null);
          setTradeTokenKey(k);
        }}
        onToggleWatch={toggleWatchlist}
        isWatching={
          detailTokenKey
            ? watchlist.has(detailTokenKey.toLowerCase())
            : false
        }
        heatHistory={
          detailTokenKey
            ? heatHistoryRef.current.get(detailTokenKey.toLowerCase()) || []
            : []
        }
        onCopy={handleCopy}
      />

      {/* Floating Alert Cards */}
      <AlertStack
        cards={floatingCards}
        onDismiss={(id) =>
          setFloatingCards((prev) => prev.filter((c) => c.id !== id))
        }
        onTrade={(k) => setTradeTokenKey(k)}
      />

      {/* Copy/Info Toast */}
      <Toast message={toastMessage} />
    </>
  );
}
