import { PixelCloud, PixelMeadow } from "@/components/Pixel";
import { seeded } from "@/lib/night";

// Positions come from a fixed seed so server and client render the same sky.
const rand = seeded(20250101);

// Hard colour bands with a checkerboard dither between them, like pixel art
const BANDS = ["--sky-1", "--sky-2", "--sky-3", "--sky-4", "--sky-5"];

const CLOUDS = [
  { seed: 11, w: 34, h: 15, top: 6, dur: 140, delay: -20 },
  { seed: 23, w: 26, h: 12, top: 22, dur: 110, delay: -75 },
  { seed: 37, w: 40, h: 16, top: 38, dur: 170, delay: -120 },
  { seed: 41, w: 22, h: 10, top: 54, dur: 95, delay: -40 },
  { seed: 59, w: 30, h: 13, top: 14, dur: 125, delay: -100 },
];

const SPARKLES = Array.from({ length: 22 }, () => ({
  left: rand() * 100,
  top: rand() * 72,
  big: rand() < 0.35,
  dur: 2 + rand() * 3,
  delay: rand() * 4,
}));

function Sparkle({ big }: { big: boolean }) {
  const p = big ? 3 : 2;
  return (
    <svg width={p * 5} height={p * 5} viewBox="0 0 5 5" shapeRendering="crispEdges" fill="#fff">
      {big ? (
        <path d="M2 0h1v2h2v1H3v2H2V3H0V2h2z" />
      ) : (
        <path d="M2 1h1v1h1v1H3v1H2V3H1V2h1z" />
      )}
    </svg>
  );
}

export default function Sky() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* bands */}
      <div className="absolute inset-0 flex flex-col">
        {BANDS.map((b, i) => (
          <div key={b} className="relative flex-1" style={{ background: `var(${b})` }}>
            {i < BANDS.length - 1 && (
              <div
                className="absolute inset-x-0 bottom-0 h-2"
                style={{
                  background: `conic-gradient(var(${BANDS[i + 1]}) 25%, transparent 0 50%, var(${BANDS[i + 1]}) 0 75%, transparent 0) 0 0 / 8px 8px`,
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* sparkles */}
      {SPARKLES.map((s, i) => (
        <span
          key={i}
          className="animate-blink absolute"
          style={
            {
              left: `${s.left}%`,
              top: `${s.top}%`,
              "--dur": `${s.dur}s`,
              "--delay": `${s.delay}s`,
            } as React.CSSProperties
          }
        >
          <Sparkle big={s.big} />
        </span>
      ))}

      {/* drifting clouds */}
      {CLOUDS.map((c) => (
        <div
          key={c.seed}
          className="animate-drift absolute left-0"
          style={
            {
              top: `${c.top}%`,
              "--dur": `${c.dur}s`,
              "--delay": `${c.delay}s`,
            } as React.CSSProperties
          }
        >
          <PixelCloud seed={c.seed} w={c.w} h={c.h} px={5} />
        </div>
      ))}
    </div>
  );
}

// The meadow the bunnies live on. It sits in front of the page (like the
// ground in a game) so the bunnies are never hidden behind cards.
export function Meadow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 h-[calc(144px+env(safe-area-inset-bottom))] overflow-hidden md:h-20"
    >
      <div className="absolute inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] flex justify-center md:bottom-0">
        <PixelMeadow seed={7} w={340} h={16} px={5} className="shrink-0" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[calc(64px+env(safe-area-inset-bottom))] bg-[#5fa97b] md:hidden" />
    </div>
  );
}
