import React from "react";
import type { DexPair } from "../types/token";
import { heatOf, sym } from "../utils/helpers";

interface RadarProps {
  tokens: DexPair[];
  onSelectToken?: (address: string) => void;
}

export const Radar: React.FC<RadarProps> = ({ tokens, onSelectToken }) => {
  const ranked = React.useMemo(() => {
    return [...tokens]
      .map((p) => ({ ...p, _heat: heatOf(p) }))
      .sort((a, b) => (b._heat || 0) - (a._heat || 0))
      .slice(0, 12);
  }, [tokens]);

  return (
    <div className="radar" id="radar" aria-label="Live token radar">
      <div className="ticks"></div>
      <div className="ring" style={{ ["--i" as string]: "0" }}></div>
      <div className="ring" style={{ ["--i" as string]: "16%" }}></div>
      <div className="ring" style={{ ["--i" as string]: "32%" }}></div>
      <div className="cross"></div>
      <div className="sweepwrap">
        <div className="sweep"></div>
      </div>
      <div className="core"></div>

      <div id="blips">
        {ranked.map((p, i) => {
          const ang = (i * 137.5 + 20) % 360;
          const heat = p._heat ?? 50;
          const r = 12 + (1 - heat / 100) * 30 + (i % 3) * 3;
          const x = 50 + r * Math.sin((ang * Math.PI) / 180);
          const y = 50 - r * Math.cos((ang * Math.PI) / 180);
          const size = 8 + Math.round(heat / 14);
          const delay = (ang / 360 * 4).toFixed(2);
          const isHot = i < 3;

          return (
            <a
              key={p.baseToken?.address || i}
              className={`blip${isHot ? " hot" : ""}`}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (onSelectToken && p.baseToken?.address) {
                  e.preventDefault();
                  onSelectToken(p.baseToken.address);
                }
              }}
              title={`${p.baseToken?.name || ""} · Heat ${heat}`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                ["--s" as string]: `${size}px`,
                ["--d" as string]: `${delay}s`,
              }}
            >
              <i></i>
              {i < 6 && <span>${sym(p)}</span>}
            </a>
          );
        })}
      </div>

      <div className="radar-hud" style={{ left: "50%", top: "-34px", transform: "translateX(-50%)" }}>
        RH-CHAIN · LIVE
      </div>
      <div
        className="radar-hud"
        id="hudCount"
        style={{ left: "50%", bottom: "-34px", transform: "translateX(-50%)", color: "var(--muted)" }}
      >
        {tokens.length > 0 ? `${tokens.length} TARGETS · TOP ${ranked.length} SHOWN` : "LOCKING TARGETS…"}
      </div>
    </div>
  );
};
