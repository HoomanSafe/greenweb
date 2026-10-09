import React from "react";
import type { DexPair, RadarAlertItem } from "../types/token";
import {
  heatOf,
  sym,
  price,
  pctFormatted,
  money,
  age,
  getFlags,
  isOfficial,
  num,
} from "../utils/helpers";
import { AlertsPanel } from "./AlertsPanel";

interface LiveBoardProps {
  tokens: DexPair[];
  isLoading: boolean;
  lastUpdatedText: string;
  onRefresh: () => void;
  watchlist: Set<string>;
  onToggleWatchlist: (key: string) => void;
  onOpenTrade: (key: string) => void;
  onOpenDetail: (key: string) => void;
  onCopy: (txt: string) => void;
  alertsConfig: {
    on: boolean;
    alertNew: boolean;
    alertHeat: boolean;
    heatThreshold: number;
    alertPump: boolean;
    pumpThreshold: number;
    alertDump: boolean;
    sound: boolean;
  };
  onUpdateAlertsConfig: (newConfig: Partial<LiveBoardProps["alertsConfig"]>) => void;
  alertFeed: RadarAlertItem[];
  onClearAlertFeed: () => void;
  unreadAlerts: number;
  isAlertsOpen: boolean;
  onToggleAlerts: () => void;
  onCloseAlerts: () => void;
  onShowToast: (msg: string) => void;
}

export const LiveBoard: React.FC<LiveBoardProps> = ({
  tokens,
  isLoading,
  lastUpdatedText,
  onRefresh,
  watchlist,
  onToggleWatchlist,
  onOpenTrade,
  onOpenDetail,
  onCopy,
  alertsConfig,
  onUpdateAlertsConfig,
  alertFeed,
  onClearAlertFeed,
  unreadAlerts,
  isAlertsOpen,
  onToggleAlerts,
  onCloseAlerts,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = React.useState<string>("heat");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [minLiq, setMinLiq] = React.useState<number>(0);
  const [shownCount, setShownCount] = React.useState<number>(25);

  const spotTokens = React.useMemo(() => {
    return [...tokens]
      .map((p) => ({ ...p, _heat: heatOf(p) }))
      .filter((p) => (num(p.liquidity?.usd) || 0) >= 1000)
      .sort((a, b) => (b._heat || 0) - (a._heat || 0))
      .slice(0, 3);
  }, [tokens]);

  const filteredTokens = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let arr = tokens
      .map((p) => ({ ...p, _heat: heatOf(p) }))
      .filter((p) => (num(p.liquidity?.usd) || 0) >= minLiq)
      .filter(
        (p) =>
          !q ||
          [p.baseToken?.name, p.baseToken?.symbol, p.baseToken?.address].some((x) =>
            (x || "").toLowerCase().includes(q)
          )
      );

    if (activeTab === "watch") {
      arr = arr.filter((p) => watchlist.has((p.baseToken?.address || "").toLowerCase()));
    }

    const by: Record<string, (a: DexPair, b: DexPair) => number> = {
      heat: (a, b) => (b._heat || 0) - (a._heat || 0),
      new: (a, b) => (b.pairCreatedAt || 0) - (a.pairCreatedAt || 0),
      gain: (a, b) => (num(b.priceChange?.h24) || -1e9) - (num(a.priceChange?.h24) || -1e9),
      vol: (a, b) => (num(b.volume?.h24) || 0) - (num(a.volume?.h24) || 0),
      watch: (a, b) => (b._heat || 0) - (a._heat || 0),
    };

    arr.sort(by[activeTab] || by.heat);

    // Official token stays at top if present
    const oi = arr.findIndex((p) =>
      isOfficial((p.baseToken?.address || "").toLowerCase())
    );
    if (oi > 0) {
      arr.unshift(arr.splice(oi, 1)[0]);
    }

    return arr;
  }, [tokens, minLiq, searchQuery, activeTab, watchlist]);

  const spotLabels = ["🔥 HOTTEST", "⚡ RISING", "🌱 ON WATCH"];

  return (
    <section id="board">
      <div className="wrap">
        <div className="head">
          <div>
            <div className="eyebrow">01 / Live board</div>
            <h2>What's getting the green light.</h2>
          </div>
          <div className="updated">
            <span className="dot"></span>
            <span id="upd">{lastUpdatedText}</span>
            <button
              className="btn"
              id="refresh"
              onClick={onRefresh}
              style={{ padding: "6px 12px", fontSize: "13px" }}
            >
              ↻ Refresh
            </button>
            <AlertsPanel
              config={alertsConfig}
              onUpdateConfig={onUpdateAlertsConfig}
              feed={alertFeed}
              onClearFeed={onClearAlertFeed}
              onTrade={onOpenTrade}
              isOpen={isAlertsOpen}
              onToggle={onToggleAlerts}
              onClose={onCloseAlerts}
              unreadCount={unreadAlerts}
              onShowToast={onShowToast}
            />
          </div>
        </div>

        {/* Spotlights */}
        <div className="spots" id="spots">
          {spotTokens.map((p, i) => {
            const t = p.baseToken;
            const k = (t?.address || "").toLowerCase();
            const p1h = pctFormatted(p.priceChange?.h1);
            const p24 = pctFormatted(p.priceChange?.h24);
            const heat = p._heat ?? heatOf(p);

            return (
              <a
                key={k || i}
                className="spot"
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (e.defaultPrevented) return;
                }}
              >
                <div className="rk">0{i + 1}</div>
                <span className="label">{spotLabels[i] || "HOT"}</span>
                <div className="top">
                  <div className="ico">
                    {p.info?.imageUrl ? (
                      <img
                        src={p.info.imageUrl}
                        alt=""
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      (t?.symbol || "?").slice(0, 2)
                    )}
                  </div>
                  <div>
                    <h3>${sym(p)}</h3>
                    <div className="nm">{t?.name}</div>
                  </div>
                </div>
                <div
                  className="pr"
                  dangerouslySetInnerHTML={{ __html: price(p.priceUsd) }}
                ></div>
                <div className="chg">
                  <span>
                    1h <span className={p1h.className}>{p1h.text}</span>
                  </span>
                  <span>
                    24h <span className={p24.className}>{p24.text}</span>
                  </span>
                </div>
                <div className="meta">
                  <div>
                    Volume 24h<b>{money(p.volume?.h24)}</b>
                  </div>
                  <div>
                    Liquidity<b>{money(p.liquidity?.usd)}</b>
                  </div>
                </div>
                <div className="hb">
                  Heat{" "}
                  <div className="bar">
                    <i style={{ width: `${heat}%` }}></i>
                  </div>
                  <b className="mono" style={{ color: "var(--green)" }}>
                    {heat}
                  </b>
                </div>
                <span
                  className="tbtn wide"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onOpenTrade(k);
                  }}
                >
                  ⚡ Trade ${sym(p)}
                </span>
              </a>
            );
          })}
        </div>

        {/* Controls */}
        <div className="controls">
          <div className="tabs" role="tablist">
            <button
              className={`tab ${activeTab === "heat" ? "on" : ""}`}
              onClick={() => {
                setActiveTab("heat");
                setShownCount(25);
              }}
            >
              🔥 Hot
            </button>
            <button
              className={`tab ${activeTab === "new" ? "on" : ""}`}
              onClick={() => {
                setActiveTab("new");
                setShownCount(25);
              }}
            >
              🌱 New
            </button>
            <button
              className={`tab ${activeTab === "gain" ? "on" : ""}`}
              onClick={() => {
                setActiveTab("gain");
                setShownCount(25);
              }}
            >
              🚀 Gainers
            </button>
            <button
              className={`tab ${activeTab === "vol" ? "on" : ""}`}
              onClick={() => {
                setActiveTab("vol");
                setShownCount(25);
              }}
            >
              📊 Volume
            </button>
            <button
              className={`tab ${activeTab === "watch" ? "on" : ""}`}
              onClick={() => {
                setActiveTab("watch");
                setShownCount(25);
              }}
            >
              ⭐ Watchlist{" "}
              <span id="wCount" className="wcount">
                {watchlist.size ? `(${watchlist.size})` : ""}
              </span>
            </button>
          </div>

          <label className="search">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#5E8570"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              id="q"
              placeholder="Search name, ticker or paste a contract address"
              autoComplete="off"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShownCount(25);
              }}
            />
          </label>

          <select
            id="minliq"
            aria-label="Minimum liquidity"
            value={minLiq}
            onChange={(e) => {
              setMinLiq(Number(e.target.value));
              setShownCount(25);
            }}
          >
            <option value="0">Any liquidity</option>
            <option value="1000">Liq ≥ $1K</option>
            <option value="10000">Liq ≥ $10K</option>
            <option value="50000">Liq ≥ $50K</option>
          </select>
        </div>

        {/* Board Table */}
        <div className="board">
          <div className="row th">
            <div>#</div>
            <div>Token</div>
            <div>Price</div>
            <div>1h</div>
            <div className="c-24">24h</div>
            <div className="c-vol">Vol 24h</div>
            <div className="c-liq">Liquidity</div>
            <div className="c-age">Age</div>
            <div className="c-heat">Heat</div>
            <div style={{ textAlign: "right" }}>Links</div>
          </div>

          <div id="rows">
            {isLoading && !filteredTokens.length ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div className="row" key={i}>
                  <div className="skel" style={{ width: "14px" }}></div>
                  <div className="skel"></div>
                  <div className="skel"></div>
                  <div className="skel"></div>
                  <div className="skel c-24"></div>
                  <div className="skel c-vol"></div>
                  <div className="skel c-liq"></div>
                  <div className="skel c-age"></div>
                  <div className="skel c-heat"></div>
                  <div></div>
                </div>
              ))
            ) : !filteredTokens.length ? (
              <div className="empty">
                {activeTab === "watch" && !searchQuery
                  ? "Your watchlist is empty. Tap ☆ next to any token to keep an eye on it."
                  : tokens.length
                  ? "No tokens match this filter."
                  : "No Robinhood Chain tokens found right now. Try refreshing in a minute."}
              </div>
            ) : (
              filteredTokens.slice(0, shownCount).map((p, i) => {
                const t = p.baseToken;
                const k = (t?.address || "").toLowerCase();
                const off = isOfficial(k);
                const w = watchlist.has(k);
                const flags = getFlags(p);
                const p1h = pctFormatted(p.priceChange?.h1);
                const p24 = pctFormatted(p.priceChange?.h24);
                const heat = p._heat ?? heatOf(p);

                return (
                  <div
                    key={k || i}
                    className={`row${off ? " official" : ""}`}
                    data-k={k}
                  >
                    <div className="rank mono">
                      <button
                        className={`star${w ? " on" : ""}`}
                        aria-label={w ? "Remove from watchlist" : "Add to watchlist"}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWatchlist(k);
                        }}
                      >
                        {w ? "★" : "☆"}
                      </button>
                      <span>{off ? "★" : i + 1}</span>
                    </div>

                    <div
                      className="tok"
                      data-detail={k}
                      title="Open token details"
                      onClick={() => onOpenDetail(k)}
                    >
                      <div className="ico">
                        {p.info?.imageUrl ? (
                          <img
                            src={p.info.imageUrl}
                            alt=""
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          (t?.symbol || "?").slice(0, 2)
                        )}
                      </div>
                      <div className="tname">
                        <b>
                          ${sym(p)}{" "}
                          <span
                            className="qt"
                            style={{
                              display: "inline",
                              color: "var(--dim)",
                              fontWeight: 400,
                            }}
                          >
                            / {p.quoteToken?.symbol || ""}
                          </span>
                        </b>
                        <span>{t?.name}</span>
                        <div className="flags">
                          {off && <span className="flag off">OFFICIAL</span>}
                          {flags.map((f, idx) => (
                            <span key={idx} className={f.className}>
                              {f.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div
                      className="c-price mono"
                      dangerouslySetInnerHTML={{ __html: price(p.priceUsd) }}
                    ></div>
                    <div className={`c-1h ${p1h.className}`}>{p1h.text}</div>
                    <div className={`c-24 ${p24.className}`}>{p24.text}</div>
                    <div className="c-vol">{money(p.volume?.h24)}</div>
                    <div className="c-liq">{money(p.liquidity?.usd)}</div>
                    <div className="c-age mono" style={{ color: "var(--muted)" }}>
                      {age(p.pairCreatedAt)}
                    </div>
                    <div className="c-heat heat">
                      <div className="bar">
                        <i style={{ width: `${heat}%` }}></i>
                      </div>
                      <em className="mono">{heat}</em>
                    </div>
                    <div className="acts">
                      <button
                        className="tbtn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenTrade(k);
                        }}
                      >
                        Trade
                      </button>
                      <button
                        className="ib"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCopy(t?.address || "");
                        }}
                        aria-label="Copy contract"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect x="9" y="9" width="12" height="12" rx="2" />
                          <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                        </svg>
                      </button>
                      <a
                        className="ib"
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Open chart"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M3 17l6-6 4 4 8-8" />
                          <path d="M14 7h7v7" />
                        </svg>
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {filteredTokens.length > shownCount && (
          <div className="more">
            <button
              className="btn"
              id="moreBtn"
              onClick={() => setShownCount((prev) => prev + 25)}
            >
              Show more ↓
            </button>
          </div>
        )}

        <p className="note">
          Data from public DEX market feeds, refreshed every 30 seconds. Heat is a simple
          momentum score (volume vs liquidity, buy pressure, 1h move), not a buy signal.
          Always check the contract yourself.
        </p>
      </div>
    </section>
  );
};
