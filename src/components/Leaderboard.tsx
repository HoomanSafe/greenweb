import React from "react";
import type { DexPair } from "../types/token";
import { heatOf, sym, pctFormatted, money, num } from "../utils/helpers";

interface LeaderboardProps {
  tokens: DexPair[];
  onOpenTrade: (key: string) => void;
  onOpenDetail: (key: string) => void;
  onCopy: (txt: string) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  tokens,
  onOpenTrade,
  onOpenDetail,
  onCopy,
}) => {
  const topTokens = React.useMemo(() => {
    return [...tokens]
      .map((p) => ({ ...p, _heat: heatOf(p) }))
      .filter((p) => (num(p.liquidity?.usd) || 0) >= 1000)
      .sort((a, b) => (b._heat || 0) - (a._heat || 0))
      .slice(0, 10);
  }, [tokens]);

  const generateBoardText = (n: number = 5) => {
    const v = topTokens.slice(0, n);
    const m = ["🥇", "🥈", "🥉", "4.", "5.", "6.", "7.", "8.", "9.", "10."];
    return `hottest on robinhood chain right now 🔥\n\n${v
      .map((p, i) => `${m[i]} $${sym(p)} · heat ${p._heat ?? heatOf(p)}`)
      .join("\n")}\n\nlive on greenlightrh.online`;
  };

  const shareHref = `https://x.com/intent/post?text=${encodeURIComponent(
    generateBoardText(5)
  )}`;

  return (
    <section id="leaders">
      <div className="wrap">
        <div className="head">
          <div>
            <div className="eyebrow">02 / Leaderboard</div>
            <h2>Today's hottest on Robinhood Chain.</h2>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              className="btn"
              id="lbCopy"
              style={{ padding: "8px 14px", fontSize: "13px" }}
              onClick={() => onCopy(generateBoardText(5))}
            >
              Copy as post
            </button>
            <a
              className="btn primary"
              id="lbShare"
              href={shareHref}
              target="_blank"
              rel="noopener noreferrer"
              style={{ padding: "8px 14px", fontSize: "13px" }}
            >
              Share on X ↗
            </a>
          </div>
        </div>

        <div className="lboard glass" id="lboard">
          {!topTokens.length ? (
            <div className="empty">Ranking tokens…</div>
          ) : (
            topTokens.map((p, i) => {
              const t = p.baseToken;
              const k = (t?.address || "").toLowerCase();
              const heat = p._heat ?? heatOf(p);
              const p24 = pctFormatted(p.priceChange?.h24);

              return (
                <div className="lrow" key={k || i}>
                  <div className="pos">{i + 1}</div>
                  <div
                    className="tok"
                    data-detail={k}
                    style={{ cursor: "pointer" }}
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
                      <b>${sym(p)}</b>
                      <span>{t?.name}</span>
                    </div>
                  </div>
                  <div className="lh">
                    <div className="bar">
                      <i style={{ width: `${heat}%` }}></i>
                    </div>
                    <b className="mono" style={{ color: "var(--green)" }}>
                      {heat}
                    </b>
                  </div>
                  <div className={`l24 ${p24.className}`}>{p24.text}</div>
                  <div className="lvol">{money(p.volume?.h24)}</div>
                  <div style={{ textAlign: "right" }}>
                    <button
                      className="tbtn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenTrade(k);
                      }}
                    >
                      Trade
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <p className="note">
          Live ranking by Heat score, refreshed with every scan. Liquidity under $1K is left out.
        </p>
      </div>
    </section>
  );
};
