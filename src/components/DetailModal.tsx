import React from "react";
import type { DexPair } from "../types/token";
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

interface DetailModalProps {
  token: DexPair | null;
  onClose: () => void;
  onTrade: (key: string) => void;
  onToggleWatch: (key: string) => void;
  isWatching: boolean;
  heatHistory: number[];
  onCopy: (txt: string) => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  token,
  onClose,
  onTrade,
  onToggleWatch,
  isWatching,
  heatHistory,
  onCopy,
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (token) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [token, onClose]);

  if (!token) return null;

  const t = token.baseToken;
  const k = (t?.address || "").toLowerCase();
  const heat = token._heat ?? heatOf(token);
  const tx = token.txns?.h24 || {};
  const pair = token.pairAddress || (token.url || "").split("/").pop() || "";
  const off = isOfficial(k);
  const flags = getFlags(token);

  const mcap = token.marketCap ?? token.fdv;
  const p5m = pctFormatted(token.priceChange?.m5);
  const p1h = pctFormatted(token.priceChange?.h1);
  const p6h = pctFormatted(token.priceChange?.h6);
  const p24 = pctFormatted(token.priceChange?.h24);

  const shareTxt = encodeURIComponent(
    `$${sym(token)} is heating up on Robinhood Chain 🟢 Heat ${heat}/100\n\nspotted on greenlightrh.online`
  );

  const renderSparkline = () => {
    if (!heatHistory || heatHistory.length < 2) {
      return (
        <span style={{ color: "var(--dim)" }}>
          Heat history builds up as the radar keeps scanning.
        </span>
      );
    }
    const w = 300;
    const h = 40;
    const mx = Math.max(100, ...heatHistory);
    const pts = heatHistory
      .map((v, i) => `${(i / (heatHistory.length - 1)) * w},${h - (v / mx) * h}`)
      .join(" ");
    return (
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <polyline
          points={pts}
          fill="none"
          stroke="#3DFF8A"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  };

  return (
    <div
      className="tmodal on"
      id="detail"
      aria-hidden="false"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="tpanel dpanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dTitle"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="ib tclose" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div className="ico">
            {token.info?.imageUrl ? (
              <img
                src={token.info.imageUrl}
                alt=""
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              (t?.symbol || "?").slice(0, 2)
            )}
          </div>
          <div>
            <h3
              id="dTitle"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "24px",
                lineHeight: "1.1",
              }}
            >
              ${sym(token)}{" "}
              {off && (
                <span
                  className="flag off"
                  style={{ fontSize: "11px", verticalAlign: "middle" }}
                >
                  OFFICIAL
                </span>
              )}
            </h3>
            <div style={{ color: "var(--dim)", fontSize: "13px" }}>
              {t?.name} · {(token.dexId || "").replace(/^./, (c) => c.toUpperCase())} ·{" "}
              {age(token.pairCreatedAt)} old
            </div>
          </div>
        </div>

        <div className="dgrid">
          <div>
            <span>Price</span>
            <b
              className="mono"
              dangerouslySetInnerHTML={{ __html: price(token.priceUsd) }}
            ></b>
          </div>
          <div>
            <span>Market cap</span>
            <b>{money(mcap)}</b>
          </div>
          <div>
            <span>Liquidity</span>
            <b>{money(token.liquidity?.usd)}</b>
          </div>
          <div>
            <span>Heat</span>
            <b className="mono" style={{ color: "var(--green)" }}>
              {heat}/100
            </b>
          </div>
          <div>
            <span>5m / 1h</span>
            <b>
              <span className={p5m.className}>{p5m.text}</span>{" "}
              <span className={p1h.className}>{p1h.text}</span>
            </b>
          </div>
          <div>
            <span>6h / 24h</span>
            <b>
              <span className={p6h.className}>{p6h.text}</span>{" "}
              <span className={p24.className}>{p24.text}</span>
            </b>
          </div>
          <div>
            <span>Vol 1h / 24h</span>
            <b>
              {money(token.volume?.h1)} / {money(token.volume?.h24)}
            </b>
          </div>
          <div>
            <span>Txns 24h</span>
            <b>
              <span className="up">{num(tx.buys) || 0}</span> /{" "}
              <span className="down">{num(tx.sells) || 0}</span>
            </b>
          </div>
        </div>

        {flags.length > 0 && (
          <div className="flags" style={{ marginBottom: "10px" }}>
            {flags.map((f, i) => (
              <span key={i} className={f.className}>
                {f.label}
              </span>
            ))}
          </div>
        )}

        <div className="dchart">
          <iframe
            title="Live chart"
            loading="lazy"
            src={`https://dexscreener.com/robinhood/${encodeURIComponent(pair)}?embed=1&loadChartSettings=0&trades=0&tabs=0&info=0&chartLeftToolbar=0&chartTheme=dark&theme=dark&chartStyle=1&chartType=usd&interval=15`}
          ></iframe>
        </div>

        <div className="dhist">Heat trend {renderSparkline()}</div>

        <div className="tca mono" style={{ margin: 0 }}>
          <span>{t?.address}</span>
          <button
            className="ib"
            onClick={() => onCopy(t?.address || "")}
            aria-label="Copy contract"
          >
            ⧉
          </button>
        </div>

        <div className="dacts">
          <button className="tbtn" onClick={() => onTrade(k)}>
            ⚡ Trade
          </button>
          <button className="btn" onClick={() => onToggleWatch(k)}>
            {isWatching ? "★ Watching" : "☆ Watch"}
          </button>
          <a
            className="btn"
            href={`https://x.com/intent/post?text=${shareTxt}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Share on X ↗
          </a>
          <a className="btn" href={token.url} target="_blank" rel="noopener noreferrer">
            DexScreener ↗
          </a>
        </div>
      </div>
    </div>
  );
};
