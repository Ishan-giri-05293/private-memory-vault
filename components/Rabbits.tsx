"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { isNightNow } from "@/lib/night";
import { LINES, pick, pickLine, specialDay, type BunnyEvent } from "@/lib/bunnies";
import { birthdayChatter, effectiveNow } from "@/lib/birthday";

type State =
  | "idle"
  | "move"
  | "groom"
  | "sleep"
  | "follow" // Ishan trailing behind Aru
  | "rush" // Ishan running over for a kiss
  | "kiss"
  | "cheer"
  | "snack"; // sharing a carrot

type Who = "aru" | "ishan";

type Rabbit = {
  who: Who;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  hopUntil: number;
  flipUntil: number;
  facing: 1 | -1;
  state: State;
  stateUntil: number;
  fur: string;
  shade: string;
  // night: 3 taps wakes a bunny up for a while
  taps: number;
  lastTap: number;
  awakeUntil: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  kind: "heart" | "z" | "confetti";
  color?: string;
};

// css px per art pixel
const PX = 3;
// bunny drawing scale
const S = 1.4;
const OUTLINE = [110, 76, 147]; // --line
const CONFETTI = ["#ff5c9d", "#ffa3cd", "#c3a9f7", "#fff4ec", "#ffd36e"];
const LAST_VISIT_KEY = "aru_last_visit_v1";
const TAPS_TO_WAKE = 3;
const AWAKE_MS = 5 * 60_000;
// how far apart they stand: nose to nose, snuggled asleep, and walking one behind the other
const KISS_GAP = 100;
const SLEEP_GAP = 92;
const FOLLOW_GAP = 104;
const SNACK_GAP = 128;
const CARROT_BITES = 6;
const BITES_PER_TURN = 2;

// Two pixel bunnies, Aru and Ishan, who live in the meadow at the bottom
// of every page. They're drawn smoothly onto a tiny canvas, snapped to hard
// pixels with an outline, then scaled up without smoothing.
export default function Rabbits() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const aruTagRef = useRef<HTMLDivElement | null>(null);
  const ishanTagRef = useRef<HTMLDivElement | null>(null);
  // invisible tap areas over each bunny, so a tap never falls through to the page
  const aruHitRef = useRef<HTMLDivElement | null>(null);
  const ishanHitRef = useRef<HTMLDivElement | null>(null);
  const tapRef = useRef<((who: Who) => void) | null>(null);
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const out = canvas.getContext("2d")!;
    const low = document.createElement("canvas");
    const g = low.getContext("2d", { willReadFrequently: true })!;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const special = specialDay(effectiveNow());
    let frame = 0;
    let w = 0;
    let h = 0;
    let particles: Particle[] = [];

    // speech bubble + name tags are real HTML so the text stays crisp
    let bubble: { text: string; until: number; who: Who } | null = null;
    let tagsUntil = 0;
    let nextChatter = performance.now() + 30_000;

    // where their feet touch the meadow, above the phone tab bar
    const ground = () => h - (w < 768 ? 64 : 0) - 54;
    const groundY = () => ground() - Math.random() * 8;
    const clampX = (x: number) => Math.min(Math.max(x, 60), w - 60);

    const make = (who: Who, x: number, facing: 1 | -1, fur: string, shade: string): Rabbit => ({
      who, x, y: 0, targetX: x, targetY: 0, hopUntil: 0, flipUntil: 0, facing,
      state: "idle", stateUntil: 0, fur, shade, taps: 0, lastTap: 0, awakeUntil: 0,
    });

    const aru = make("aru", window.innerWidth * 0.58, -1, "#ffffff", "#f3d9ea");
    const ishan = make("ishan", window.innerWidth * 0.58 - SLEEP_GAP, 1, "#d9a77f", "#bf8a62");
    const rabbits = [ishan, aru];
    const other = (r: Rabbit) => (r === aru ? ishan : aru);
    const byWho = (who: Who) => (who === "aru" ? aru : ishan);

    // carrot sharing: one finds it, takes two bites, passes it over, and so on
    let snack: {
      holder: Who;
      bites: number;
      turnBites: number;
      phase: "gather" | "eat" | "pass";
      until: number;
    } | null = null;
    let nextSnack = performance.now() + 25_000 + Math.random() * 20_000;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      out.setTransform(dpr, 0, 0, dpr, 0, 0);
      out.imageSmoothingEnabled = false;
      low.width = Math.ceil(w / PX);
      low.height = Math.ceil(h / PX);
      for (const r of rabbits) {
        r.x = r.targetX = clampX(r.x);
        r.y = r.targetY = groundY();
      }
    };
    resize();
    window.addEventListener("resize", resize);

    const asleepTime = (r: Rabbit, now: number) => isNightNow() && now > r.awakeUntil;

    // Daytime entrance: they hop in from opposite sides so she notices them straight away
    if (!isNightNow() && !reduceMotion) {
      aru.x = w + 70;
      aru.facing = -1;
      aru.state = "move";
      aru.targetX = clampX(w * 0.6);
      aru.stateUntil = performance.now() + 4500;
      ishan.x = -70;
      ishan.facing = 1;
      ishan.state = "follow";
      ishan.stateUntil = performance.now() + 4500;
    }

    const say = (text: string, ms = 4500, who: Who = "ishan") => {
      bubble = { text, until: performance.now() + ms, who };
      if (bubbleRef.current) bubbleRef.current.textContent = text;
    };

    // greeting: special day, "missed you" after a few days away, or a normal line
    try {
      const last = Number(localStorage.getItem(LAST_VISIT_KEY) || 0);
      const away = last && Date.now() - last > 3 * 86_400_000;
      localStorage.setItem(LAST_VISIT_KEY, String(Date.now()));
      setTimeout(() => {
        if (special === "birthday") say(birthdayChatter());
        else if (special === "anniversary") say(LINES.anniversary);
        else if (away) say(LINES.missedYou);
        else say(isNightNow() ? LINES.asleep : pickLine(pathRef.current));
      }, 2200);
    } catch {}

    // ---- drawing ------------------------------------------------------

    const ellipse = (x: number, y: number, rx: number, ry: number, rot = 0) => {
      g.beginPath();
      g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
      g.fill();
    };

    const drawHeart = (x: number, y: number) => {
      g.fillStyle = "#ff5c9d";
      g.beginPath();
      g.moveTo(x, y + 4);
      g.bezierCurveTo(x - 9, y - 4, x - 5, y - 12, x, y - 6);
      g.bezierCurveTo(x + 5, y - 12, x + 9, y - 4, x, y + 4);
      g.fill();
    };

    const drawZ = (p: Particle) => {
      g.fillStyle = "#ffffff";
      g.fillRect(p.x, p.y, PX * 3, PX);
      g.fillRect(p.x + PX, p.y + PX, PX, PX);
      g.fillRect(p.x, p.y + PX * 2, PX * 3, PX);
    };

    const drawHat = (asleep: boolean) => {
      g.save();
      g.translate(15, asleep ? -34 : -38);
      g.rotate(asleep ? -0.5 : 0);
      g.fillStyle = "#ffd36e";
      g.beginPath();
      g.moveTo(-7, 0);
      g.lineTo(7, 0);
      g.lineTo(0, -20);
      g.closePath();
      g.fill();
      g.fillStyle = "#ff5c9d";
      g.fillRect(-4, -8, 9, 3);
      ellipse(0, -21, 3, 3);
      g.restore();
    };

    const drawRabbit = (r: Rabbit, t: number) => {
      const asleep = r.state === "sleep";
      const grooming = r.state === "groom";
      const kissing = r.state === "kiss";
      const moving =
        ["move", "follow", "rush", "sleep"].includes(r.state) && Math.abs(r.targetX - r.x) > 3;
      const tapHop = t < r.hopUntil ? Math.sin(((r.hopUntil - t) / 600) * Math.PI) * 16 : 0;
      const flipping = t < r.flipUntil;
      const flipHop = flipping ? Math.sin(((r.flipUntil - t) / 800) * Math.PI) * 34 : 0;
      const cheerHop = r.state === "cheer" ? Math.abs(Math.sin(t / 140)) * 18 : 0;
      const walkHop =
        moving && !reduceMotion ? Math.abs(Math.sin(t / (r.state === "rush" ? 90 : 170))) * 7 : 0;
      // hops move in whole art pixels so the sprite never smears
      const lift = Math.round((tapHop + walkHop + flipHop + cheerHop) / PX) * PX;
      const breathe = Math.round(Math.sin(t / (asleep ? 1200 : 700)));
      const lean = kissing ? 5 : 0;

      g.save();
      g.translate(r.x + r.facing * lean, r.y - lift);
      if (flipping) {
        const a = (1 - (r.flipUntil - t) / 800) * Math.PI * 2;
        g.translate(0, -18 * S);
        g.rotate(-r.facing * a);
        g.translate(0, 18 * S);
      }
      g.scale(r.facing * S, S);

      // tail
      g.fillStyle = "#ffffff";
      ellipse(-19, -12, 7, 6.5);

      // body
      g.fillStyle = r.fur;
      ellipse(0, -13 + breathe, 20, 14.5);

      // belly shading + feet
      g.fillStyle = r.shade;
      ellipse(-6, -3, 12, 4);
      ellipse(12, -2, 6, 3.5);

      // ears (flop back while sleeping, twitch while grooming)
      const twitch = grooming ? Math.sin(t / 90) * 0.15 : 0;
      const earRot = asleep ? -1.25 : -0.22 + twitch;
      const earRot2 = asleep ? -1.05 : 0.18 - twitch;
      const earBase = asleep ? { x: 6, y: -30 } : { x: 11, y: -46 };
      g.fillStyle = r.fur;
      ellipse(earBase.x, earBase.y, 5.5, 13.5, earRot);
      ellipse(earBase.x + 8, earBase.y + 1, 5.5, 13.5, earRot2);
      g.fillStyle = "#ffa3cd";
      ellipse(earBase.x, earBase.y + 1, 2.4, 9, earRot);
      ellipse(earBase.x + 8, earBase.y + 2, 2.4, 9, earRot2);

      // head
      g.fillStyle = r.fur;
      ellipse(15, -27 + breathe, 12, 11);

      // Aru's pink bow sits at the base of her ears
      if (r.who === "aru") {
        const by = (asleep ? -34 : -38) + breathe;
        g.fillStyle = "#ff5c9d";
        g.beginPath();
        g.moveTo(14, by);
        g.lineTo(5, by - 7);
        g.lineTo(5, by + 6);
        g.closePath();
        g.fill();
        g.beginPath();
        g.moveTo(14, by);
        g.lineTo(23, by - 7);
        g.lineTo(23, by + 6);
        g.closePath();
        g.fill();
        g.fillStyle = "#e2589a";
        ellipse(14, by, 3, 3);
      }

      // cheek (Aru blushes while being kissed)
      g.fillStyle = "#ffa3cd";
      ellipse(19, -21 + breathe, kissing && r.who === "aru" ? 5 : 3.5, kissing ? 3.2 : 2.5);

      // eye (a closed line while sleeping or kissing)
      g.fillStyle = "#3a1f57";
      if (asleep || kissing) g.fillRect(16, -28 + breathe, 7, 2.6);
      else ellipse(19.5, -28.5 + breathe, 2.2, 2.8);

      // Ishan's round glasses
      if (r.who === "ishan") {
        g.strokeStyle = "#3a1f57";
        g.lineWidth = 2.2;
        g.beginPath();
        g.arc(19.5, -28.5 + breathe, 6.4, 0, Math.PI * 2);
        g.moveTo(14, -29 + breathe);
        g.lineTo(6, -31 + breathe);
        g.stroke();
      }

      // nose
      g.fillStyle = "#e2589a";
      ellipse(26.5, -25 + breathe, 2, 2);

      // paw up to the face while grooming
      if (grooming) {
        g.fillStyle = r.fur;
        ellipse(23, -17 + Math.round(Math.sin(t / 120)) * 3, 4.5, 3.5, -0.6);
      }

      if (special) drawHat(asleep);

      g.restore();
    };

    // a little pink blanket over both of them at night
    const drawBlanket = () => {
      const left = Math.min(aru.x, ishan.x) - 34;
      const right = Math.max(aru.x, ishan.x) + 34;
      const y = Math.max(aru.y, ishan.y);
      g.fillStyle = "#ffa3cd";
      g.fillRect(left, y - 24, right - left, 26);
      g.fillStyle = "#ffffff";
      for (let x = left + 8; x < right - 4; x += 15) {
        g.fillRect(x, y - 16, PX * 2, PX * 2);
        g.fillRect(x + 7, y - 6, PX * 2, PX * 2);
      }
      g.fillStyle = "#e2589a";
      g.fillRect(left, y - 24, right - left, PX * 2);
    };

    // Snap the soft drawing to hard pixels and wrap it in a 1px outline
    const pixelate = (top: number) => {
      const y0 = Math.max(0, Math.floor(top / PX));
      const rows = low.height - y0;
      if (rows <= 0) return;
      const img = g.getImageData(0, y0, low.width, rows);
      const d = img.data;
      const lw = low.width;
      const solid = new Uint8Array(lw * rows);
      for (let i = 0; i < lw * rows; i++) {
        if (d[i * 4 + 3] >= 110) {
          solid[i] = 1;
          d[i * 4 + 3] = 255;
        } else d[i * 4 + 3] = 0;
      }
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < lw; x++) {
          const i = y * lw + x;
          if (solid[i]) continue;
          if (
            (x > 0 && solid[i - 1]) ||
            (x < lw - 1 && solid[i + 1]) ||
            (y > 0 && solid[i - lw]) ||
            (y < rows - 1 && solid[i + lw])
          ) {
            d[i * 4] = OUTLINE[0];
            d[i * 4 + 1] = OUTLINE[1];
            d[i * 4 + 2] = OUTLINE[2];
            d[i * 4 + 3] = 255;
          }
        }
      }
      g.putImageData(img, 0, y0);
    };

    // ---- behaviour ------------------------------------------------------

    const burstHearts = (x: number, y: number, n: number) => {
      for (let i = 0; i < n; i++) {
        particles.push({
          x: x + (Math.random() - 0.5) * 30,
          y: y - Math.random() * 20,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -0.5 - Math.random() * 0.6,
          life: 1,
          kind: "heart",
        });
      }
    };

    const confetti = () => {
      for (let i = 0; i < 46; i++) {
        particles.push({
          x: (aru.x + ishan.x) / 2,
          y: Math.min(aru.y, ishan.y) - 70,
          vx: (Math.random() - 0.5) * 7,
          vy: -3 - Math.random() * 4,
          life: 1,
          kind: "confetti",
          color: CONFETTI[i % CONFETTI.length],
        });
      }
    };

    const decideAru = (now: number) => {
      if (asleepTime(aru, now)) {
        aru.state = "sleep";
        aru.stateUntil = now + 8000;
        return;
      }
      if (reduceMotion) {
        aru.state = "idle";
        aru.stateUntil = now + 5000;
        return;
      }
      const roll = Math.random();
      if (roll < 0.25) {
        aru.state = "groom";
        aru.stateUntil = now + 2600;
      } else if (roll < 0.55) {
        aru.state = "idle";
        aru.stateUntil = now + 3500;
      } else {
        aru.state = "move";
        aru.stateUntil = now + 6000;
        aru.targetX = clampX(60 + Math.random() * (w - 120));
        aru.targetY = groundY();
      }
    };

    const decideIshan = (now: number) => {
      if (asleepTime(ishan, now)) {
        ishan.state = "sleep";
        ishan.stateUntil = now + 8000;
        return;
      }
      if (reduceMotion) {
        ishan.state = "idle";
        ishan.stateUntil = now + 5000;
        return;
      }
      // mostly trailing after her, sometimes a little break
      if (Math.random() < 0.15) {
        ishan.state = "groom";
        ishan.stateUntil = now + 2000;
      } else {
        ishan.state = "follow";
        ishan.stateUntil = now + 7000;
      }
    };

    const kiss = (now: number) => {
      ishan.state = "kiss";
      aru.state = "kiss";
      ishan.stateUntil = aru.stateUntil = now + 1800;
      ishan.facing = ishan.x < aru.x ? 1 : -1;
      aru.facing = ishan.x < aru.x ? -1 : 1;
      burstHearts((aru.x + ishan.x) / 2, Math.min(aru.y, ishan.y) - 60, 7);
      say(pick(LINES.kiss), 2500);
    };

    const mouth = (r: Rabbit) => ({ x: r.x + r.facing * 27 * S, y: r.y - 23 * S });

    const crumbs = (x: number, y: number) => {
      for (let i = 0; i < 4; i++) {
        particles.push({
          x, y,
          vx: (Math.random() - 0.5) * 2.4,
          vy: -1 - Math.random() * 1.5,
          life: 0.5,
          kind: "confetti",
          color: "#ff9a3c",
        });
      }
    };

    const startSnack = (now: number) => {
      const holder: Who = Math.random() < 0.5 ? "aru" : "ishan";
      snack = { holder, bites: CARROT_BITES, turnBites: 0, phase: "gather", until: now + 6000 };
      for (const r of rabbits) {
        r.state = "snack";
        r.stateUntil = Infinity;
      }
      aru.targetX = aru.x;
      say(pick(LINES.carrotFound), 2500, holder);
    };

    const endSnack = (now: number, finished: boolean) => {
      if (!snack) return;
      snack = null;
      for (const r of rabbits) {
        if (r.state !== "snack") continue;
        r.state = "idle";
        r.stateUntil = now + 2500;
      }
      if (finished) {
        burstHearts((aru.x + ishan.x) / 2, Math.min(aru.y, ishan.y) - 60, 4);
        say(pick(LINES.carrotDone), 2500);
      }
      nextSnack = now + 60_000 + Math.random() * 60_000;
    };

    const updateSnack = (now: number) => {
      const busy = (r: Rabbit) => ["sleep", "kiss", "rush", "cheer"].includes(r.state);
      if (!snack) {
        if (now > nextSnack && !isNightNow() && !reduceMotion && !busy(aru) && !busy(ishan)) startSnack(now);
        return;
      }
      // anything else happening (a tap, a celebration) cancels the snack
      if (aru.state !== "snack" || ishan.state !== "snack") {
        endSnack(now, false);
        return;
      }
      if (snack.phase === "gather") {
        ishan.targetX = clampX(aru.x + (ishan.x < aru.x ? -SNACK_GAP : SNACK_GAP));
        ishan.targetY = aru.y;
        if (Math.abs(ishan.x - ishan.targetX) < 5 || now > snack.until) {
          ishan.targetX = ishan.x;
          ishan.facing = ishan.x < aru.x ? 1 : -1;
          aru.facing = ishan.x < aru.x ? -1 : 1;
          snack.phase = "eat";
          snack.until = now + 800;
        }
      } else if (snack.phase === "eat" && now > snack.until) {
        const holder = byWho(snack.holder);
        const m = mouth(holder);
        snack.bites--;
        snack.turnBites++;
        crumbs(m.x, m.y);
        holder.hopUntil = now + 250;
        if (snack.bites <= 0) endSnack(now, true);
        else if (snack.turnBites >= BITES_PER_TURN) {
          snack.phase = "pass";
          snack.until = now + 650;
          if (Math.random() < 0.6) say(pick(LINES.carrotPass), 1800, snack.holder);
        } else snack.until = now + 900;
      } else if (snack.phase === "pass" && now > snack.until) {
        snack.holder = snack.holder === "aru" ? "ishan" : "aru";
        snack.turnBites = 0;
        snack.phase = "eat";
        snack.until = now + 700;
      }
    };

    // a carrot sticking out of a mouth; it gets shorter with every bite
    const drawCarrot = (x: number, y: number, dir: number, left: number) => {
      const len = 8 + 20 * left;
      const tip = 2 + (1 - left) * 4;
      g.fillStyle = "#ff9a3c";
      g.beginPath();
      g.moveTo(x, y - tip / 2);
      g.lineTo(x + dir * len, y - 5);
      g.lineTo(x + dir * len, y + 5);
      g.lineTo(x, y + tip / 2);
      g.closePath();
      g.fill();
      g.fillStyle = "#5fa97b";
      const end = x + dir * len;
      g.fillRect(end + (dir > 0 ? 0 : -9), y - 7, 9, 3);
      g.fillRect(end + (dir > 0 ? 0 : -8), y - 1, 8, 3);
      g.fillRect(end + (dir > 0 ? 0 : -9), y + 4, 9, 3);
    };

    const drawSnack = (now: number) => {
      if (!snack || snack.phase === "gather") return;
      const holder = byWho(snack.holder);
      const left = snack.bites / CARROT_BITES;
      if (snack.phase === "pass") {
        // tossed over in a little arc
        const a = mouth(holder);
        const b = mouth(other(holder));
        const k = Math.min(1, Math.max(0, 1 - (snack.until - now) / 650));
        drawCarrot(
          a.x + (b.x - a.x) * k,
          a.y + (b.y - a.y) * k - Math.sin(k * Math.PI) * 26,
          k < 0.5 ? holder.facing : other(holder).facing,
          left,
        );
        return;
      }
      const m = mouth(holder);
      drawCarrot(m.x, m.y, holder.facing, left);
    };

    const rushToAru = (now: number) => {
      if (["kiss", "rush", "sleep"].includes(ishan.state) || aru.state === "sleep") return;
      ishan.state = "rush";
      ishan.stateUntil = now + 4000;
      aru.state = "idle";
      aru.stateUntil = now + 4000;
    };

    const celebrate = (now: number, text: string) => {
      for (const r of rabbits) {
        if (r.state === "sleep") continue;
        r.state = "cheer";
        r.stateUntil = now + 2200;
      }
      confetti();
      say(text, 3000);
    };

    const onEvent = (e: Event) => {
      const ev = (e as CustomEvent<BunnyEvent>).detail;
      const now = performance.now();
      if (ev.type === "celebrate") celebrate(now, pick(LINES.goalDone));
      else if (ev.type === "party") celebrate(now, ev.text);
      else if (ev.type === "hug") {
        rushToAru(now);
        say(pick(LINES.letterOpened), 3500);
      } else if (ev.type === "say") {
        say(ev.text, 3000);
        if (ev.jump) ishan.hopUntil = now + 600;
      }
    };
    window.addEventListener("bunnies", onEvent);

    // After 5 minutes awake at night, one of them calls the other back to bed
    const checkBedtime = (now: number) => {
      for (const r of rabbits) {
        if (!r.awakeUntil || now < r.awakeUntil) continue;
        r.awakeUntil = 0;
        if (!isNightNow()) continue;
        const o = other(r);
        const callLines = (who: Who) => (who === "ishan" ? LINES.bedtimeIshan : LINES.bedtimeAru);
        if (o.awakeUntil > now) {
          // both up: this one calls the other, and they both go to sleep
          say(pick(callLines(r.who)), 4000, r.who);
          o.awakeUntil = 0;
          o.stateUntil = 0;
        } else {
          // the sleepy one calls from bed
          say(pick(callLines(o.who)), 4000, o.who);
        }
        r.stateUntil = 0;
      }
    };

    const animate = (time: number) => {
      checkBedtime(time);
      updateSnack(time);
      if (time > aru.stateUntil) decideAru(time);
      if (time > ishan.stateUntil) decideIshan(time);

      if (ishan.state === "follow") {
        ishan.targetX = clampX(aru.x - aru.facing * FOLLOW_GAP);
        ishan.targetY = aru.y;
      }
      if (ishan.state === "rush") {
        ishan.targetX = clampX(aru.x + (ishan.x < aru.x ? -KISS_GAP : KISS_GAP));
        ishan.targetY = aru.y;
        if (Math.abs(ishan.x - ishan.targetX) < 6) kiss(time);
      }
      // going to bed: shuffle over next to whoever is already asleep
      for (const r of rabbits) {
        if (r.state !== "sleep") continue;
        const o = other(r);
        if (o.state === "sleep") {
          r.targetX = clampX(o.x + (r.x < o.x ? -SLEEP_GAP : SLEEP_GAP));
          r.targetY = o.y;
        } else {
          r.targetX = r.x;
        }
      }

      for (const r of rabbits) {
        const speed =
          r.state === "rush" ? 0.07 : r.state === "follow" || r.state === "snack" ? 0.025 : 0.012;
        if (["move", "follow", "rush", "sleep", "snack"].includes(r.state)) {
          const dx = r.targetX - r.x;
          const dy = r.targetY - r.y;
          if (Math.abs(dx) > 3) r.facing = dx > 0 ? 1 : -1;
          r.x += dx * speed;
          r.y += dy * speed;
        }
      }

      // when they're side by side and resting, they look at each other
      const close = Math.abs(aru.x - ishan.x) < 125;
      const bothAsleep = aru.state === "sleep" && ishan.state === "sleep";
      if (
        close &&
        ["idle", "sleep", "follow"].includes(ishan.state) &&
        Math.abs(ishan.targetX - ishan.x) < 4
      ) {
        ishan.facing = ishan.x < aru.x ? 1 : -1;
        if (aru.state !== "move") aru.facing = ishan.x < aru.x ? -1 : 1;
        if (Math.random() < (bothAsleep ? 0.006 : 0.004)) {
          if (bothAsleep) {
            particles.push({ x: (aru.x + ishan.x) / 2 + 10, y: aru.y - 66, vx: 0.2, vy: -0.35, life: 1, kind: "z" });
          } else if (aru.state !== "sleep") {
            burstHearts((aru.x + ishan.x) / 2, Math.min(aru.y, ishan.y) - 60, 1);
          }
        }
      }

      // chatter every so often
      if (time > nextChatter) {
        if (bothAsleep) say(LINES.asleep);
        else if (special === "birthday" && Math.random() < 0.7) say(birthdayChatter());
        else say(pickLine(pathRef.current));
        nextChatter = time + 28_000 + Math.random() * 20_000;
      }

      // draw
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, low.width, low.height);
      g.setTransform(1 / PX, 0, 0, 1 / PX, 0, 0);

      for (const r of rabbits) drawRabbit(r, time);
      drawSnack(time);
      if (bothAsleep && close) drawBlanket();

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.kind === "confetti") {
          p.vy += 0.15;
          p.vx *= 0.98;
          p.life -= 0.012;
          g.fillStyle = p.color!;
          g.fillRect(p.x, p.y, PX * 2, PX * 2);
        } else {
          p.life -= 0.01;
          if (p.kind === "heart") drawHeart(p.x, p.y);
          else drawZ(p);
        }
      }
      particles = particles.filter((p) => p.life > 0 && p.y < h);

      pixelate(ground() - 260);

      out.clearRect(0, 0, w, h);
      out.drawImage(low, 0, 0, low.width * PX, low.height * PX);

      // speech bubble above whoever is talking, name tags while tapped
      const b = bubbleRef.current;
      if (b) {
        const show = bubble && time < bubble.until;
        b.style.opacity = show ? "1" : "0";
        if (show && bubble) {
          const sp = bubble.who === "aru" ? aru : ishan;
          const bx = Math.min(Math.max(sp.x, b.offsetWidth / 2 + 8), w - b.offsetWidth / 2 - 8);
          b.style.transform = `translate(${bx - b.offsetWidth / 2}px, ${sp.y - 80 - b.offsetHeight}px)`;
          b.style.setProperty("--tail", `${sp.x - bx + b.offsetWidth / 2}px`);
          b.dataset.who = bubble.who;
        }
      }
      const showTags = time < tagsUntil;
      for (const [el, r] of [
        [aruTagRef.current, aru],
        [ishanTagRef.current, ishan],
      ] as const) {
        if (!el) continue;
        el.style.opacity = showTags ? "1" : "0";
        el.style.transform = `translate(${r.x - el.offsetWidth / 2}px, ${r.y + 4}px)`;
      }
      for (const [el, r] of [
        [aruHitRef.current, aru],
        [ishanHitRef.current, ishan],
      ] as const) {
        if (el) el.style.transform = `translate(${r.x - 46}px, ${r.y - 84}px)`;
      }

      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);

    // Taps on a sleeping bunny: two sleepy mumbles, the third wakes them up
    const tapSleeping = (r: Rabbit, now: number) => {
      if (now - r.lastTap > 2500) r.taps = 0;
      r.taps++;
      r.lastTap = now;
      r.hopUntil = now + 400;
      if (r.taps < TAPS_TO_WAKE) {
        say(pick(r.who === "ishan" ? LINES.sleepyIshan : LINES.sleepyAru), 1600, r.who);
        return;
      }
      r.taps = 0;
      r.awakeUntil = now + AWAKE_MS;
      r.state = "idle";
      r.stateUntil = now + 1500;
      say(pick(r.who === "ishan" ? LINES.wokeIshan : LINES.wokeAru), 3000, r.who);
    };

    // Each bunny has its own tap area on top of the page
    tapRef.current = (who: Who) => {
      const now = performance.now();
      const r = byWho(who);
      tagsUntil = now + 2500;

      if (r.state === "sleep") {
        tapSleeping(r, now);
      } else if (r === aru) {
        aru.hopUntil = now + 600;
        burstHearts(aru.x, aru.y - 70, 1);
        if (aru.state !== "snack") rushToAru(now);
      } else {
        ishan.flipUntil = now + 800;
        say(pick(LINES.silly), 2000);
      }
    };

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      tapRef.current = null;
      window.removeEventListener("bunnies", onEvent);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 z-30" />

      {/* speech bubble (Ishan's is white, Aru's is pink) */}
      <div
        ref={bubbleRef}
        role="status"
        className="pointer-events-none fixed left-0 top-0 z-40 max-w-[220px] bg-paper px-3 py-2 text-center font-pixel text-base leading-tight text-ink opacity-0 transition-opacity duration-300 data-[who=aru]:bg-[#ffd6e8] after:absolute after:left-[var(--tail,50%)] after:top-full after:-ml-[6px] after:border-x-[6px] after:border-t-[8px] after:border-x-transparent after:border-t-[var(--line)] after:content-['']"
        style={{
          boxShadow:
            "0 -3px 0 0 var(--line), 0 3px 0 0 var(--line), -3px 0 0 0 var(--line), 3px 0 0 0 var(--line)",
        }}
      />

      {/* tap areas, so a tap on a bunny never opens the page behind it */}
      {(
        [
          [aruHitRef, "aru", "Aru bunny"],
          [ishanHitRef, "ishan", "Ishan bunny"],
        ] as const
      ).map(([ref, who, label]) => (
        <div
          key={who}
          ref={ref}
          role="button"
          aria-label={label}
          onPointerDown={(e) => {
            e.preventDefault();
            tapRef.current?.(who);
          }}
          className="fixed left-0 top-0 z-40 h-[88px] w-[92px] cursor-pointer touch-manipulation select-none [-webkit-tap-highlight-color:transparent]"
        />
      ))}

      {/* name tags */}
      {(
        [
          [aruTagRef, "Aru", "bg-pink"],
          [ishanTagRef, "Ishan", "bg-lav"],
        ] as const
      ).map(([ref, name, bg]) => (
        <div
          key={name}
          ref={ref}
          aria-hidden
          className={`pointer-events-none fixed left-0 top-0 z-40 px-2 py-0.5 font-pixel text-sm text-ink opacity-0 transition-opacity duration-300 ${bg}`}
        >
          {name}
        </div>
      ))}
    </>
  );
}
