import { hashString, seeded } from "@/lib/night";

// Drawn on a small grid so everything lands on whole pixels
const W = 80;
const H = 24;

// A goal drawn as a little pixel constellation: each milestone is a star
// that lights up when done, and finished neighbours get joined up.
export default function Constellation({
  id,
  lit,
  achieved,
}: {
  id: string;
  lit: boolean[];
  achieved: boolean;
}) {
  const rand = seeded(hashString(id));
  const n = Math.max(lit.length, 2);
  const stars = Array.from({ length: n }, (_, i) => ({
    x: Math.round(6 + (i * (W - 12)) / (n - 1) + (rand() - 0.5) * (20 / n)),
    y: Math.round(5 + rand() * (H - 10)),
    on: achieved || !!lit[i],
  }));

  // Bresenham-ish line as a list of pixels
  const linePixels = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const pts: [number, number][] = [];
    const steps = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y));
    for (let s = 2; s < steps - 1; s++) {
      pts.push([
        Math.round(a.x + ((b.x - a.x) * s) / steps),
        Math.round(a.y + ((b.y - a.y) * s) / steps),
      ]);
    }
    return pts;
  };

  return (
    <div className="bg-[var(--sky-1)] p-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        shapeRendering="crispEdges"
        role="img"
        aria-label={`${stars.filter((s) => s.on).length} of ${n} stars lit`}
      >
        {stars.slice(1).map((s, i) => {
          const prev = stars[i];
          const joined = prev.on && s.on;
          return linePixels(prev, s).map(([x, y], k) =>
            joined || k % 3 === 0 ? (
              <rect
                key={`${i}-${k}`}
                x={x}
                y={y}
                width={1}
                height={1}
                fill={joined ? "#fff4ec" : "#c9b3f7"}
              />
            ) : null,
          );
        })}

        {stars.map((s, i) =>
          s.on ? (
            <path
              key={i}
              fill="#ffffff"
              d={`M${s.x} ${s.y - 2}h1v2h2v1h-2v2h-1v-2h-2v-1h2z`}
            />
          ) : (
            <rect key={i} x={s.x} y={s.y} width={1} height={1} fill="#e3d6ff" />
          ),
        )}
      </svg>
    </div>
  );
}
