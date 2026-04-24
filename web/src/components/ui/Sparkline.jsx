import React, { useMemo } from "react";

export default function Sparkline({
  data,
  color = "var(--accent)",
  height = 48,
  width = 180,
  fill = true,
}) {
  const id = useMemo(() => "sg-" + Math.random().toString(36).slice(2, 8), []);
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const pad = 2;

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (width - pad * 2) + pad;
    const y =
      height - pad - ((v - min) / (max - min || 1)) * (height - pad * 2);
    return [x, y];
  });

  const line = pts
    .map(
      (p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + " " + p[1].toFixed(1),
    )
    .join(" ");
  const area = line + ` L ${width - pad} ${height} L ${pad} ${height} Z`;
  const last = pts[pts.length - 1];

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${id})`} />}
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill={color} />
    </svg>
  );
}
