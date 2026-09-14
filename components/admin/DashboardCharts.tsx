"use client";

type Point = { label: string; value: number };
type Slice = { label: string; value: number; color: string };

export function Sparkline({ values }: { values: number[] }) {
  const width = 92;
  const height = 32;
  const max = Math.max(...values, 1);
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values.map((value, index) => {
    const x = index * step;
    const y = height - 3 - (value / max) * (height - 8);
    return `${x},${y}`;
  });
  const origin = points[0] ?? `0,${height}`;
  const end = points[points.length - 1] ?? `${width},${height}`;
  const area = `${origin} ${points.join(" ")} ${end.split(",")[0]},${height} 0,${height}`;

  return (
    <svg className="admin-spark" viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      <polygon points={area} fill="color-mix(in srgb, var(--gold) 22%, transparent)" />
      <polyline points={points.join(" ")} fill="none" stroke="var(--gold)" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function AreaChart({ points, empty }: { points: Point[]; empty?: string }) {
  const width = 560;
  const height = 220;
  const pad = { l: 12, r: 12, t: 16, b: 28 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const max = Math.max(...points.map((p) => p.value), 1);
  const coords = points.map((point, index) => {
    const x = pad.l + (points.length > 1 ? (index / (points.length - 1)) * innerW : innerW / 2);
    const y = pad.t + innerH - (point.value / max) * innerH;
    return { x, y, ...point };
  });
  const line = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const area = `${pad.l},${pad.t + innerH} ${line} ${pad.l + innerW},${pad.t + innerH}`;
  const hasData = points.some((p) => p.value > 0);

  return (
    <div className="admin-chart-body">
      {!hasData && empty ? <p className="admin-chart-empty">{empty}</p> : null}
      <svg viewBox={`0 0 ${width} ${height}`} className="admin-chart-svg" role="img">
        {[0.25, 0.5, 0.75, 1].map((tick) => (
          <line
            key={tick}
            x1={pad.l}
            x2={width - pad.r}
            y1={pad.t + innerH * (1 - tick)}
            y2={pad.t + innerH * (1 - tick)}
            stroke="var(--sand)"
            strokeDasharray="4 6"
          />
        ))}
        {hasData && (
          <>
            <polygon points={area} fill="url(#adminGoldFill)" />
            <polyline points={line} fill="none" stroke="var(--gold)" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
            {coords.filter((_, i) => i % 2 === 0 || i === coords.length - 1).map((c) => (
              <circle key={c.label} cx={c.x} cy={c.y} r="3.2" fill="var(--surface)" stroke="var(--gold)" strokeWidth="1.6" />
            ))}
          </>
        )}
        {coords.filter((_, i) => i === 0 || i === coords.length - 1 || i === Math.floor(coords.length / 2)).map((c) => (
          <text key={c.label} x={c.x} y={height - 8} textAnchor="middle" fill="var(--muted)" fontSize="11">
            {c.label}
          </text>
        ))}
        <defs>
          <linearGradient id="adminGoldFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--gold)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export function DonutChart({ slices, empty }: { slices: Slice[]; empty?: string }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const radius = 58;
  const stroke = 16;
  const c = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="admin-donut">
      <svg viewBox="0 0 160 160" width="160" height="160" aria-hidden="true">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="var(--sand)" strokeWidth={stroke} />
        {total > 0 &&
          slices.map((slice) => {
            const length = (slice.value / total) * c;
            const circle = (
              <circle
                key={slice.label}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={stroke}
                strokeDasharray={`${length} ${c - length}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                transform="rotate(-90 80 80)"
              />
            );
            offset += length;
            return circle;
          })}
        <text x="80" y="76" textAnchor="middle" fill="var(--black)" fontSize="22" fontWeight="800">
          {total}
        </text>
        <text x="80" y="96" textAnchor="middle" fill="var(--muted)" fontSize="10" letterSpacing="0.14em">
          TOTAL
        </text>
      </svg>
      <ul className="admin-legend">
        {slices.length === 0 || total === 0 ? (
          <li className="admin-chart-empty">{empty}</li>
        ) : (
          slices.map((slice) => (
            <li key={slice.label}>
              <span style={{ background: slice.color }} />
              <em>{slice.label}</em>
              <strong>{slice.value}</strong>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export function BarChart({ bars }: { bars: Point[] }) {
  const max = Math.max(...bars.map((bar) => bar.value), 1);
  return (
    <div className="admin-bars">
      {bars.map((bar) => (
        <div key={bar.label} className="admin-bar">
          <div className="admin-bar__meta">
            <span>{bar.label}</span>
            <strong>{bar.value}</strong>
          </div>
          <div className="admin-bar__track">
            <div className="admin-bar__fill" style={{ width: `${Math.max(6, (bar.value / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
