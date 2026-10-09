import React from "react";

export const HowItWorks: React.FC = () => {
  return (
    <section id="how">
      <div className="wrap">
        <div className="head">
          <div>
            <div className="eyebrow">03 / How it works</div>
            <h2>Three signals. One glance.</h2>
          </div>
        </div>
        <div className="steps">
          <div className="step">
            <div className="n">01</div>
            <h3>We scan the chain</h3>
            <p>
              Greenlight pulls fresh pairs, boosted tokens and new profiles on Robinhood Chain
              and groups them by token, every minute.
            </p>
          </div>
          <div className="step">
            <div className="n">02</div>
            <h3>We score the momentum</h3>
            <p>
              Each token gets a Heat score from 0 to 100 based on volume versus liquidity,
              buy pressure and its last-hour move.
            </p>
          </div>
          <div className="step">
            <div className="n">03</div>
            <h3>We flag the risks</h3>
            <p>
              Brand-new launches, thin liquidity and heavy selling get clear tags, so you
              can tell a breakout from a trap.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
