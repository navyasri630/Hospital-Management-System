import React from "react";
import "./VitalsStrip.css";

// The page's signature element: a monitor-style strip that echoes a
// bedside vitals display, reframed as a readout of the system's own stats.
const VitalsStrip = ({ readings }) => {
  return (
    <div className="vitals-strip card">
      <svg
        className="vitals-line"
        viewBox="0 0 600 40"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <polyline
          points="0,20 40,20 55,6 70,34 85,20 140,20 155,10 165,30 175,20 260,20 275,4 288,36 300,20 380,20 395,12 407,28 418,20 600,20"
          fill="none"
          stroke="var(--mint-500)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="vitals-readouts">
        {readings.map((r) => (
          <div key={r.label} className="vitals-readout">
            <div className="vitals-value">{r.value}</div>
            <div className="vitals-label eyebrow">{r.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VitalsStrip;
