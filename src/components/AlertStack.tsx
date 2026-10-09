import React from "react";
import type { RadarAlertItem } from "../types/token";

interface AlertStackProps {
  cards: RadarAlertItem[];
  onDismiss: (id: string) => void;
  onTrade: (key: string) => void;
}

export const AlertStack: React.FC<AlertStackProps> = ({ cards, onDismiss, onTrade }) => {
  if (!cards.length) return null;

  return (
    <div className="alstack" id="alStack" aria-live="polite">
      {cards.map((c) => {
        const id = c.id || `${c.key}-${c.t}`;
        return (
          <div className="alcard" key={id}>
            <span className="ae">{c.emoji}</span>
            <div className="at">
              <b>
                ${c.sym} · {c.title}
              </b>
              <span>{c.detail}</span>
            </div>
            <button className="tbtn" onClick={() => onTrade(c.key)}>
              Trade
            </button>
            <button className="x" aria-label="Dismiss" onClick={() => onDismiss(id)}>
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
};
