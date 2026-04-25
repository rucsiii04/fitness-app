import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LabelList,
  ResponsiveContainer,
} from "recharts";

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { hour, value } = payload[0].payload;
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border-strong)",
        borderRadius: 8,
        padding: "8px 12px",
        fontFamily: "var(--mono)",
        fontSize: 12,
        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
      }}
    >
      <div style={{ color: "var(--text-dim)", marginBottom: 3 }}>
        {String(hour).padStart(2, "0")}:00 – {String(hour).padStart(2, "0")}:59
      </div>
      <div style={{ color: "var(--accent)", fontWeight: 700, fontSize: 14 }}>
        {value} check-in{value !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

export default function HourlyBarChart({ data, height = 200, isToday = true }) {
  const currentHour = new Date().getHours();
  const chartData = data.map((value, hour) => ({ hour, value }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        barSize={20}
        margin={{ top: 18, right: 4, left: -8, bottom: 0 }}
      >
        <CartesianGrid
          vertical={false}
          stroke="rgba(255,255,255,0.1)"
          strokeDasharray="3 3"
        />
        <XAxis
          dataKey="hour"
          tickFormatter={(h) => (h % 3 === 0 ? String(h).padStart(2, "0") : "")}
          tick={{ fontSize: 10, fontFamily: "var(--mono)", fill: "var(--text-dim)" }}
          axisLine={false}
          tickLine={false}
          interval={0}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 10, fontFamily: "var(--mono)", fill: "var(--text-dim)" }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          <LabelList
            dataKey="value"
            position="top"
            formatter={(v) => (v > 0 ? v : "")}
            style={{
              fontSize: 9,
              fontFamily: "var(--mono)",
              fill: "var(--text-dim)",
            }}
          />
          {chartData.map(({ hour, value }) => (
            <Cell
              key={hour}
              fill={
                isToday && hour === currentHour
                  ? "var(--accent)"
                  : value > 0
                  ? "rgba(224,251,76,0.55)"
                  : "rgba(255,255,255,0.07)"
              }
              stroke={isToday && hour === currentHour ? "var(--accent)" : "none"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
