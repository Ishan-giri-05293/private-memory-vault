"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Letter } from "@/components/Envelope";
import { PixelIcon } from "@/components/Pixel";
import { bunnies, LINES, pick } from "@/lib/bunnies";
import { prettyDate } from "@/lib/dates";
import { readMemories, type Memory } from "@/lib/memories";
import {
  birthdayKey,
  birthdayThisYear,
  daysUntilBirthday,
  effectiveNow,
  formatHour,
  GIFTS,
  isBirthday,
  type Gift,
} from "@/lib/birthday";

function readList(key: string): string[] {
  try {
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeList(key: string, list: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {}
}

function untilText(ms: number) {
  const m = Math.max(1, Math.ceil(ms / 60_000));
  const h = Math.floor(m / 60);
  return h ? `${h}h ${m % 60}m` : `${m}m`;
}

export default function BirthdayPage() {
  const [now, setNow] = useState<Date | null>(null);
  const [opened, setOpened] = useState<string[]>([]);
  const [active, setActive] = useState<Gift | null>(null);

  useEffect(() => {
    const tick = () => setNow(effectiveNow());
    tick();
    setOpened(readList(birthdayKey("opened")));
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, []);

  // tell her when a new gift opens while she's on the page
  const [announced, setAnnounced] = useState<number | null>(null);
  const today = now ? isBirthday(now) : false;
  const readyCount = now && today ? GIFTS.filter((g) => now.getHours() >= g.hour).length : 0;
  useEffect(() => {
    if (!today) return;
    if (announced !== null && readyCount > announced) {
      bunnies({ type: "party", text: "a new gift just opened!" });
    }
    setAnnounced(readyCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyCount, today]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setActive(null);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active]);

  if (!now) return <main className="page" />;

  // After the day, everything stays open if she celebrated here that year
  const bdayEnd = new Date(birthdayThisYear(now).getTime() + 86_400_000);
  const pastAndCelebrated = now >= bdayEnd && opened.length > 0;

  const unlockAt = (g: Gift) => {
    const d = new Date(now);
    d.setHours(g.hour, 0, 0, 0);
    return d;
  };
  const isOpen = (g: Gift) => pastAndCelebrated || (today && now >= unlockAt(g));

  const openGift = (g: Gift) => {
    setActive(g);
    if (!opened.includes(g.id)) {
      const next = [...opened, g.id];
      setOpened(next);
      writeList(birthdayKey("opened"), next);
      bunnies({ type: "hug" });
    }
  };

  const days = daysUntilBirthday(now);

  return (
    <main className="page">
      <header className="text-center">
        <motion.div
          className="mx-auto w-fit text-pink-deep"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        >
          <PixelIcon name="cake" size={6} />
        </motion.div>
        <h1 className="page-title mt-4">
          Happy
          <br />
          Birthday, Aru
        </h1>
        <p className="page-sub">
          {today
            ? "a new gift opens every few hours today"
            : pastAndCelebrated
              ? "your birthday gifts, to open again any time"
              : "something is waiting for you here on 31 January"}
        </p>
      </header>

      {!today && !pastAndCelebrated && (
        <div className="pixel-card mx-auto mt-8 max-w-xs px-6 py-5 text-center">
          <p className="font-pixel text-6xl leading-none text-pink-deep">{days}</p>
          <p className="mt-2 font-pixel text-lg text-ink">
            {days === 1 ? "day to go" : "days to go"}
          </p>
          <p className="mt-1 text-sm text-ink-soft">no peeking. the gifts are locked.</p>
        </div>
      )}

      <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {GIFTS.map((g, i) => {
          const open = isOpen(g);
          const seen = opened.includes(g.id);
          const waitMs = unlockAt(g).getTime() - now.getTime();
          return (
            <li key={g.id} className="animate-pop" style={{ "--delay": `${i * 0.05}s` } as React.CSSProperties}>
              <button
                disabled={!open}
                onClick={() => openGift(g)}
                className="pixel-card flex h-[calc(100%-8px)] w-[calc(100%-8px)] cursor-pointer flex-col items-center gap-3 px-3 py-5 text-center transition-transform enabled:hover:-translate-y-1 disabled:cursor-default focus-visible:outline-3 focus-visible:outline-offset-6 focus-visible:outline-pink-deep"
              >
                <span
                  className={`flex h-16 w-16 items-center justify-center ${
                    open ? "bg-pink/40 text-pink-deep" : "bg-ink/5 text-line/30"
                  }`}
                >
                  <span className={open && !seen ? "animate-wiggle" : ""}>
                    <PixelIcon name="gift" size={4} />
                  </span>
                </span>
                <span className="font-pixel text-sm text-ink-soft">{formatHour(g.hour)}</span>
                <span className="font-pixel text-lg leading-tight text-ink">
                  {open ? g.title : "???"}
                </span>
                <span className="text-sm text-ink-soft">
                  {open
                    ? seen
                      ? "open again"
                      : "tap to open!"
                    : today
                      ? `opens in ${untilText(waitMs)}`
                      : "locked"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <AnimatePresence>
        {active && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={active.title}
            className="fixed inset-0 z-[100] overflow-y-auto bg-[var(--sky-2)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="mx-auto max-w-xl px-5 pt-4 pb-24">
              <div className="flex justify-end">
                <button
                  onClick={() => setActive(null)}
                  className="pixel-btn pixel-btn-paper px-3 py-2"
                  aria-label="Close gift"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="page-title mt-2 text-center text-4xl md:text-5xl">{active.title}</p>
              <div className="mt-8">
                <GiftContent gift={active} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function GiftContent({ gift }: { gift: Gift }) {
  switch (gift.kind) {
    case "letter":
      return <Letter greeting={gift.greeting} paragraphs={gift.paragraphs} closing={gift.closing} />;
    case "rules":
      return <Rules intro={gift.intro} rules={gift.rules} />;
    case "reasons":
      return <Reasons intro={gift.intro} reasons={gift.reasons} />;
    case "memories":
      return <MemoryLane intro={gift.intro} empty={gift.empty} />;
    case "coupons":
      return <Coupons intro={gift.intro} coupons={gift.coupons} />;
    case "wish":
      return <Wish intro={gift.intro} after={gift.after} saved={gift.saved} />;
  }
}

function Rules({ intro, rules }: { intro: string; rules: string[] }) {
  return (
    <div className="pixel-card px-6 py-7">
      <p className="text-ink-soft">{intro}</p>
      <ol className="mt-5 space-y-4">
        {rules.map((r, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.25 }}
            className="flex gap-3"
          >
            <span className="font-pixel text-lg text-pink-deep">{i + 1}.</span>
            <span className="text-[17px] leading-relaxed text-ink">{r}</span>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}

function Reasons({ intro, reasons }: { intro: string; reasons: string[] }) {
  const [n, setN] = useState(0);
  const done = n >= reasons.length;
  return (
    <div className="text-center">
      <p className="page-sub mt-0">{intro}</p>
      <button
        onClick={() => setN((v) => Math.min(v + 1, reasons.length))}
        className="pixel-card mt-6 w-[calc(100%-8px)] cursor-pointer px-6 py-10"
        style={{ minHeight: 220 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={n}
            initial={{ rotateY: -90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {n === 0 ? (
              <>
                <PixelIcon name="heart" size={6} className="mx-auto text-pink-deep" />
                <p className="mt-4 font-pixel text-2xl text-ink">tap to start</p>
              </>
            ) : (
              <>
                <p className="font-pixel text-base text-pink-deep">
                  reason {Math.min(n, reasons.length)} of {reasons.length}
                </p>
                <p className="mt-4 text-2xl font-bold leading-snug text-ink">
                  {reasons[Math.min(n, reasons.length) - 1]}
                </p>
                {!done && <p className="mt-6 text-sm text-ink-soft">tap for the next one</p>}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </button>
      {done && (
        <p className="page-sub">...and about a million more.</p>
      )}
    </div>
  );
}

function MemoryLane({ intro, empty }: { intro: string; empty: string }) {
  const [picks, setPicks] = useState<Memory[] | null>(null);
  useEffect(() => {
    const all = readMemories();
    setPicks([...all].sort(() => Math.random() - 0.5).slice(0, 5));
  }, []);
  if (!picks) return null;
  if (!picks.length) {
    return (
      <div className="pixel-card px-6 py-8 text-center">
        <p className="text-[17px] text-ink">{empty}</p>
        <Link href="/vault" className="pixel-btn mt-6">
          add a memory
        </Link>
      </div>
    );
  }
  return (
    <div>
      <p className="page-sub mt-0 text-center">{intro}</p>
      <ul className="mt-6 space-y-4">
        {picks.map((m, i) => (
          <motion.li
            key={m.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.3 }}
            className="pixel-card px-5 py-4"
            style={{ rotate: `${i % 2 ? 1 : -1}deg` }}
          >
            <p className="font-pixel text-base text-pink-deep">
              {m.date === "No date" ? "sometime" : prettyDate(m.date)}
            </p>
            <p className="mt-1 text-lg font-bold text-ink">{m.title}</p>
            {m.note && <p className="mt-1 text-ink-soft">{m.note}</p>}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

function Coupons({ intro, coupons }: { intro: string; coupons: string[] }) {
  const key = birthdayKey("coupons");
  const [used, setUsed] = useState<string[]>([]);
  useEffect(() => setUsed(readList(key)), [key]);

  const use = (c: string) => {
    if (used.includes(c)) return;
    if (!confirm(`Use this coupon now?\n\n"${c}"`)) return;
    const next = [...used, c];
    setUsed(next);
    writeList(key, next);
    bunnies({ type: "say", text: "coupon accepted! I'm on it", jump: true });
  };

  return (
    <div>
      <p className="page-sub mt-0 text-center">{intro}</p>
      <ul className="mt-6 space-y-4">
        {coupons.map((c) => {
          const isUsed = used.includes(c);
          return (
            <li key={c}>
              <button
                onClick={() => use(c)}
                disabled={isUsed}
                className="pixel-card relative flex w-[calc(100%-8px)] cursor-pointer items-center gap-4 border-l-8 border-dashed border-pink px-5 py-4 text-left disabled:cursor-default"
              >
                <PixelIcon name="heart" size={3} className={isUsed ? "text-line/25" : "text-pink-deep"} />
                <span className={`flex-1 font-bold ${isUsed ? "text-ink-soft line-through" : "text-ink"}`}>
                  {c}
                </span>
                {isUsed && (
                  <span className="rotate-[-12deg] border-3 border-pink-deep px-2 py-0.5 font-pixel text-sm text-pink-deep">
                    used
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Wish({ intro, after, saved }: { intro: string; after: string; saved: string }) {
  const key = birthdayKey("wish");
  const [lit, setLit] = useState([true, true, true]);
  const [wish, setWish] = useState("");
  const [stored, setStored] = useState(false);
  const allOut = lit.every((l) => !l);

  useEffect(() => {
    try {
      const w = localStorage.getItem(key);
      if (w !== null) {
        setWish(w);
        setStored(true);
        setLit([false, false, false]);
      }
    } catch {}
  }, [key]);

  const blow = (i: number) => {
    const next = lit.map((l, j) => (j === i ? false : l));
    setLit(next);
    if (next.every((l) => !l)) bunnies({ type: "party", text: pick(LINES.birthday) });
  };

  const save = () => {
    try {
      localStorage.setItem(key, wish.trim());
    } catch {}
    setStored(true);
  };

  return (
    <div className="text-center">
      <p className="page-sub mt-0">{allOut ? after : intro}</p>

      {/* the cake */}
      <div className="mx-auto mt-10 w-64">
        <div className="flex justify-around px-8">
          {lit.map((on, i) => (
            <button
              key={i}
              onClick={() => on && blow(i)}
              disabled={!on}
              aria-label={on ? `Blow out candle ${i + 1}` : `Candle ${i + 1} is out`}
              className="flex cursor-pointer flex-col items-center disabled:cursor-default"
            >
              <span className="flex h-8 items-end">
                {on ? (
                  <motion.svg
                    width="15"
                    height="21"
                    viewBox="0 0 5 7"
                    shapeRendering="crispEdges"
                    animate={{ scaleY: [1, 1.15, 0.95, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                    style={{ originY: 1 }}
                  >
                    <path d="M2 0h1v1h1v2h1v3H4v1H1V6H0V3h1V1h1z" fill="#ffb347" />
                    <path d="M2 3h1v1h1v2H1V4h1z" fill="#fff4b0" />
                  </motion.svg>
                ) : (
                  <span className="font-pixel text-sm text-ink-soft">~</span>
                )}
              </span>
              <span className="h-12 w-3 bg-lav outline-3 outline-line" />
            </button>
          ))}
        </div>
        <div className="mt-[3px] h-14 bg-pink outline-4 outline-line" style={{ backgroundImage: "radial-gradient(#fff 2px, transparent 2px)", backgroundSize: "16px 16px" }} />
        <div className="mt-1 h-16 bg-cloud-1 outline-4 outline-line" style={{ backgroundImage: "radial-gradient(var(--pink-deep) 2px, transparent 2px)", backgroundSize: "18px 18px", backgroundPosition: "6px 6px" }} />
        <div className="mx-[-16px] mt-1 h-3 bg-paper outline-4 outline-line" />
      </div>

      {allOut && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="pixel-card mt-12 px-6 py-6 text-left">
          {stored ? (
            <>
              <p className="font-pixel text-xl text-pink-deep">your wish</p>
              {wish && <p className="mt-2 text-[17px] italic text-ink">“{wish}”</p>}
              <p className="mt-3 text-ink-soft">{saved}</p>
            </>
          ) : (
            <>
              <label htmlFor="wish" className="field-label">
                I wish...
              </label>
              <textarea
                id="wish"
                value={wish}
                onChange={(e) => setWish(e.target.value)}
                className="field min-h-[110px] resize-y"
              />
              <button onClick={save} className="pixel-btn mt-4 w-[calc(100%-6px)]">
                keep my wish
              </button>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
