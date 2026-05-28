import React, { useMemo, useState, useRef } from "react";

export default function Sparkline({
  data,
  color = "var(--accent)",
  height = 48,
  width = 180,
  fill = true,
  labels,
  formatValue,
}) {
  const id = useMemo(() => "sg-" + Math.random().toString(36).slice(2, 8), []);
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null); // { idx, x, y }

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
    .map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + " " + p[1].toFixed(1))
    .join(" ");
  const area = line + ` L ${width - pad} ${height} L ${pad} ${height} Z`;
  const last = pts[pts.length - 1];

  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * width;
    let nearestIdx = 0;
    let nearestDist = Infinity;
    pts.forEach(([px], i) => {
      const dist = Math.abs(px - mouseX);
      if (dist < nearestDist) { nearestDist = dist; nearestIdx = i; }
    });
    setHover({ idx: nearestIdx, x: pts[nearestIdx][0], y: pts[nearestIdx][1] });
  };

  const tooltipValue = hover !== null
    ? (formatValue ? formatValue(data[hover.idx]) : String(data[hover.idx]))
    : null;
  const tooltipLabel = hover !== null && labels ? labels[hover.idx] : null;

  // Tooltip box dimensions
  const TW = 72, TH = 30, TR = 5;
  const tx = hover
    ? Math.min(Math.max(hover.x - TW / 2, 2), width - TW - 2)
    : 0;
  const ty = hover ? Math.max(hover.y - TH - 8, 2) : 0;

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{ display: "block", cursor: hover ? "crosshair" : "default", overflow: "visible" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHover(null)}
    >
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

      {hover && (
        <g>
          {/* vertical guide line */}
          <line
            x1={hover.x} y1={0}
            x2={hover.x} y2={height}
            stroke={color}
            strokeWidth={1}
            strokeDasharray="3 3"
            strokeOpacity={0.4}
          />
          {/* dot on hovered point */}
          <circle cx={hover.x} cy={hover.y} r={4} fill={color} />

          {/* tooltip bubble */}
          <rect
            x={tx} y={ty}
            width={TW} height={TH}
            rx={TR} ry={TR}
            fill="#1a1a1a"
            stroke={color}
            strokeOpacity={0.35}
            strokeWidth={1}
          />
          {tooltipLabel && (
            <text
              x={tx + TW / 2} y={ty + 10}
              textAnchor="middle"
              fontSize={8}
              fill="var(--text-dim)"
              fontFamily="var(--mono)"
            >
              {tooltipLabel}
            </text>
          )}
          <text
            x={tx + TW / 2}
            y={tooltipLabel ? ty + 22 : ty + TH / 2 + 4}
            textAnchor="middle"
            fontSize={10}
            fontWeight={700}
            fill={color}
            fontFamily="var(--mono)"
          >
            {tooltipValue}
          </text>
        </g>
      )}
    </svg>
  );
}
