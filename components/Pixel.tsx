import { seeded } from "@/lib/night";

// Tiny hand-drawn sprites. "X" is a filled pixel.
const SPRITES = {
  heart: [
    ".XX...XX.",
    "XXXX.XXXX",
    "XXXXXXXXX",
    "XXXXXXXXX",
    ".XXXXXXX.",
    "..XXXXX..",
    "...XXX...",
    "....X....",
  ],
  sparkle: [
    "...X...",
    "...X...",
    "..XXX..",
    "XXXXXXX",
    "..XXX..",
    "...X...",
    "...X...",
  ],
  envelope: [
    "XXXXXXXXXXX",
    "XX.......XX",
    "X.X.....X.X",
    "X..X...X..X",
    "X...XXX...X",
    "X.........X",
    "X.........X",
    "XXXXXXXXXXX",
  ],
  // a little photo: frame, sun and a hill
  book: [
    "XXXXXXXXXXX",
    "X.........X",
    "X.......X.X",
    "X......XXXX",
    "X..X....X.X",
    "X.XXX.....X",
    "XXXXXXX...X",
    "XXXXXXXXXXX",
  ],
  dice: [
    "XXXXXXXXX",
    "X.......X",
    "X.X...X.X",
    "X.......X",
    "X...X...X",
    "X.......X",
    "X.X...X.X",
    "X.......X",
    "XXXXXXXXX",
  ],
  star: [
    "....X....",
    "...XXX...",
    "XXXXXXXXX",
    ".XXXXXXX.",
    "..XXXXX..",
    ".XXX.XXX.",
    ".X.....X.",
  ],
  gift: [
    ".XX.....XX.",
    "..XX...XX..",
    "...XX.XX...",
    "XXXXXXXXXXX",
    "XXXXX.XXXXX",
    "XXXXX.XXXXX",
    "...........",
    ".XXXX.XXXX.",
    ".XXXX.XXXX.",
    ".XXXX.XXXX.",
    ".XXXXXXXXX.",
  ],
  cake: [
    "..X..X..X..",
    "..X..X..X..",
    "...........",
    ".XXXXXXXXX.",
    ".X.X.X.X.X.",
    ".XXXXXXXXX.",
    "XXXXXXXXXXX",
    "X.X.X.X.X.X",
    "XXXXXXXXXXX",
  ],
  balloon: [
    "..XXX..",
    ".XXXXX.",
    "XXXXXXX",
    "XXXXXXX",
    "XXXXXXX",
    ".XXXXX.",
    "..XXX..",
    "...X...",
    "...X...",
    "..X....",
    "..X....",
    "...X...",
  ],
} as const;

export type SpriteName = keyof typeof SPRITES;

function rowsToRects(rows: readonly string[]) {
  const rects: { x: number; y: number; w: number }[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (row[x] !== "X") {
        x++;
        continue;
      }
      const start = x;
      while (row[x] === "X") x++;
      rects.push({ x: start, y, w: x - start });
    }
  });
  return rects;
}

export function PixelIcon({
  name,
  size = 3,
  className = "",
}: {
  name: SpriteName;
  size?: number; // css px per pixel
  className?: string;
}) {
  const rows = SPRITES[name];
  const w = rows[0].length;
  const h = rows.length;
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${w} ${h}`}
      width={w * size}
      height={h * size}
      shapeRendering="crispEdges"
      className={`shrink-0 ${className}`}
      fill="currentColor"
    >
      {rowsToRects(rows).map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} />
      ))}
    </svg>
  );
}

// ---- Clouds -------------------------------------------------------------

const SHADES = [
  "var(--cloud-hi)",
  "var(--cloud-1)",
  "var(--cloud-2)",
  "var(--cloud-3)",
  "var(--cloud-4)",
];

type Run = { x: number; y: number; w: number; c: number };

// Builds a puffy cloud out of overlapping circles on a pixel grid,
// lit from the top left like the clouds in a pixel-art sky.
function buildCloud(seed: number, W: number, H: number, flatBottom = false): Run[] {
  const rand = seeded(seed);
  const n = 3 + Math.floor(rand() * 3);
  const circles = Array.from({ length: n }, (_, i) => {
    const r = H * (0.26 + rand() * 0.2);
    return {
      cx: W * (0.16 + (0.68 * i) / (n - 1)) + (rand() - 0.5) * W * 0.08,
      cy: H * 0.66 - rand() * H * 0.22 - (i === Math.floor(n / 2) ? H * 0.12 : 0),
      r,
    };
  });
  const baseTop = H * 0.55;
  const baseBottom = flatBottom ? H : H * 0.86;

  const shade = (x: number, y: number) => {
    let best = Infinity;
    let inside = false;
    for (const c of circles) {
      const d = Math.hypot(x - c.cx, y - c.cy);
      if (d <= c.r) {
        inside = true;
        // distance to this circle's light spot, normalised
        const l = Math.hypot(x - (c.cx - c.r * 0.35), y - (c.cy - c.r * 0.5)) / c.r;
        best = Math.min(best, l);
      }
    }
    const inBase = x >= W * 0.08 && x <= W * 0.92 && y >= baseTop && y <= baseBottom;
    if (!inside && !inBase) return -1;
    if (!inside) return y > baseBottom - 2 ? 4 : 3;
    if (best < 0.45) return 0;
    if (best < 0.8) return 1;
    if (best < 1.05) return 2;
    return 3;
  };

  const grid: number[][] = [];
  for (let y = 0; y < H; y++) {
    grid.push([]);
    for (let x = 0; x < W; x++) grid[y].push(shade(x + 0.5, y + 0.5));
  }
  // underside of every column gets the deepest shade
  for (let x = 0; x < W; x++) {
    for (let y = H - 1; y >= 0; y--) {
      if (grid[y][x] >= 0) {
        grid[y][x] = 4;
        if (y > 0 && grid[y - 1][x] >= 2) grid[y - 1][x] = 3;
        break;
      }
    }
  }

  const runs: Run[] = [];
  grid.forEach((row, y) => {
    let x = 0;
    while (x < W) {
      const c = row[x];
      if (c < 0) {
        x++;
        continue;
      }
      const start = x;
      while (x < W && row[x] === c) x++;
      runs.push({ x: start, y, w: x - start, c });
    }
  });
  return runs;
}

export function PixelCloud({
  seed,
  w,
  h,
  px = 5,
  flatBottom = false,
  className = "",
  style,
}: {
  seed: number;
  w: number;
  h: number;
  px?: number;
  flatBottom?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const runs = buildCloud(seed, w, h, flatBottom);
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${w} ${h}`}
      width={w * px}
      height={h * px}
      shapeRendering="crispEdges"
      className={className}
      style={style}
    >
      {runs.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={SHADES[r.c]} />
      ))}
    </svg>
  );
}

// ---- Meadow -------------------------------------------------------------

const MEADOW = [
  "#c8f2c6", // blade tips
  "#a7e3ad",
  "#8fd49c",
  "#76c08b",
  "#5fa97b", // deep
  "#ff8fc0", // pink petals
  "#fff4ec", // white petals
  "#ffd36e", // flower centre
];

// A strip of pixel grass with uneven blades along the top and little flowers
function buildMeadow(seed: number, W: number, H: number): Run[] {
  const rand = seeded(seed);
  const grid: number[][] = Array.from({ length: H }, () => Array(W).fill(-1));

  for (let x = 0; x < W; x++) {
    let top = 4 + Math.round(Math.sin(x * 0.07) + Math.sin(x * 0.023 + 1) * 1.2);
    if (rand() < 0.35) top -= 1 + Math.floor(rand() * 3); // a taller blade
    top = Math.max(0, top);
    for (let y = top; y < H; y++) {
      const depth = y - top;
      // soft dithered bands as the grass gets darker towards the bottom
      const band = depth < 1 ? 0 : y < 7 ? 1 : y < 10 ? 2 : y < 13 ? 3 : 4;
      const edge = (y === 7 || y === 10 || y === 13) && (x + y) % 2 === 0;
      grid[y][x] = edge && band > 0 ? band - 1 : band;
    }
  }

  // flowers: a centre with four petals
  for (let i = 0; i < Math.floor(W / 11); i++) {
    const fx = 2 + Math.floor(rand() * (W - 4));
    const fy = 7 + Math.floor(rand() * (H - 9));
    const petal = rand() < 0.6 ? 5 : 6;
    for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) grid[fy + dy][fx + dx] = petal;
    grid[fy][fx] = 7;
  }

  const runs: Run[] = [];
  grid.forEach((row, y) => {
    let x = 0;
    while (x < W) {
      const c = row[x];
      if (c < 0) {
        x++;
        continue;
      }
      const start = x;
      while (x < W && row[x] === c) x++;
      runs.push({ x: start, y, w: x - start, c });
    }
  });
  return runs;
}

export function PixelMeadow({
  seed,
  w,
  h,
  px = 5,
  className = "",
}: {
  seed: number;
  w: number;
  h: number;
  px?: number;
  className?: string;
}) {
  const runs = buildMeadow(seed, w, h);
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${w} ${h}`}
      width={w * px}
      height={h * px}
      shapeRendering="crispEdges"
      className={className}
    >
      {runs.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={MEADOW[r.c]} />
      ))}
    </svg>
  );
}
