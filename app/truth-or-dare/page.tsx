"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import Sheet from "@/components/Sheet";
import { PixelIcon } from "@/components/Pixel";
import { prettyDate } from "@/lib/dates";
import { readMemories, todayISO, writeMemories, type Memory } from "@/lib/memories";
import { CUSTOM_KEY, DARES, TRUTHS } from "@/lib/truth-or-dare";
import { bunnies, LINES, pick } from "@/lib/bunnies";

type Kind = "truth" | "dare";
type Custom = { truths: string[]; dares: string[] };

function readCustom(): Custom {
  try {
    const data = JSON.parse(localStorage.getItem(CUSTOM_KEY) || "{}");
    return {
      truths: Array.isArray(data.truths) ? data.truths : [],
      dares: Array.isArray(data.dares) ? data.dares : [],
    };
  } catch {
    return { truths: [], dares: [] };
  }
}

function shuffle<T>(list: T[]) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function TruthOrDarePage() {
  const [custom, setCustom] = useState<Custom>({ truths: [], dares: [] });
  const [moments, setMoments] = useState<Memory[]>([]);
  const [card, setCard] = useState<{ kind: Kind; text: string; n: number } | null>(null);
  // shuffled decks, so nothing repeats until every card has been drawn
  const [decks, setDecks] = useState<Record<Kind, string[]>>({ truth: [], dare: [] });

  const [keepOpen, setKeepOpen] = useState(false);
  const [keepNote, setKeepNote] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [addKind, setAddKind] = useState<Kind>("truth");
  const [addText, setAddText] = useState("");

  useEffect(() => {
    setCustom(readCustom());
    setMoments(readMemories().filter((m) => m.tag));
  }, []);

  const pool = useMemo(
    () => ({
      truth: [...TRUTHS, ...custom.truths],
      dare: [...DARES, ...custom.dares],
    }),
    [custom],
  );

  const draw = (kind: Kind) => {
    let deck = decks[kind].length ? decks[kind] : shuffle(pool[kind]);
    // don't show the same card twice in a row when a new deck starts
    if (card && deck[0] === card.text && deck.length > 1) deck = [...deck.slice(1), deck[0]];
    const [text, ...rest] = deck;
    setDecks((d) => ({ ...d, [kind]: rest }));
    setCard({ kind, text, n: (card?.n ?? 0) + 1 });
    bunnies({ type: "say", text: pick(kind === "truth" ? LINES.truth : LINES.dare), jump: true });
  };

  const closeKeep = useCallback(() => setKeepOpen(false), []);
  const closeAdd = useCallback(() => setAddOpen(false), []);

  const keepMoment = () => {
    if (!card) return;
    const m: Memory = {
      id: crypto.randomUUID(),
      title: card.text,
      date: todayISO(),
      note: keepNote.trim(),
      createdAt: Date.now(),
      tag: card.kind,
    };
    // read fresh so we never overwrite memories saved elsewhere
    writeMemories([m, ...readMemories()]);
    setMoments((prev) => [m, ...prev]);
    bunnies({ type: "say", text: pick(LINES.keptMoment), jump: true });
    setKeepNote("");
    setKeepOpen(false);
  };

  const addPrompt = () => {
    const text = addText.trim();
    if (!text) return;
    const next =
      addKind === "truth"
        ? { ...custom, truths: [...custom.truths, text] }
        : { ...custom, dares: [...custom.dares, text] };
    setCustom(next);
    // put the new one on top of the deck so it comes up next
    setDecks((d) => ({ ...d, [addKind]: [text, ...d[addKind]] }));
    try {
      localStorage.setItem(CUSTOM_KEY, JSON.stringify(next));
    } catch {}
    setAddText("");
    setAddOpen(false);
  };

  const removeCustom = (kind: Kind, text: string) => {
    const key = kind === "truth" ? "truths" : "dares";
    const next = { ...custom, [key]: custom[key].filter((t) => t !== text) };
    setCustom(next);
    setDecks((d) => ({ ...d, [kind]: d[kind].filter((t) => t !== text) }));
    try {
      localStorage.setItem(CUSTOM_KEY, JSON.stringify(next));
    } catch {}
  };

  const yours = [
    ...custom.truths.map((text) => ({ kind: "truth" as Kind, text })),
    ...custom.dares.map((text) => ({ kind: "dare" as Kind, text })),
  ];

  return (
    <main className="page">
      <header className="text-center">
        <h1 className="page-title">
          Truth
          <br />
          or Dare
        </h1>
        <p className="page-sub">our game. our rules.</p>
      </header>

      {/* Pick */}
      <div className="mx-auto mt-10 grid max-w-md grid-cols-2 gap-4">
        <button onClick={() => draw("truth")} className="pixel-btn py-6 text-2xl">
          Truth
        </button>
        <button onClick={() => draw("dare")} className="pixel-btn pixel-btn-lav py-6 text-2xl">
          Dare
        </button>
      </div>

      {/* Card */}
      <div className="mx-auto mt-8 max-w-md" style={{ perspective: 900 }}>
        <AnimatePresence mode="wait">
          {card ? (
            <motion.div
              key={card.n}
              initial={{ rotateY: -90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: 90, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="pixel-card px-6 py-8 text-center"
              style={{ "--b": card.kind === "truth" ? "var(--pink-deep)" : "#8e6fd8" } as React.CSSProperties}
            >
              <p
                className={`inline-block px-3 py-1 font-pixel text-base text-ink ${
                  card.kind === "truth" ? "bg-pink" : "bg-lav"
                }`}
              >
                {card.kind}
              </p>
              <p className="mt-5 text-2xl font-bold leading-snug text-ink">{card.text}</p>
              <button
                onClick={() => setKeepOpen(true)}
                className="mt-6 cursor-pointer font-pixel text-base text-pink-deep underline underline-offset-4"
              >
                this one was special, keep it
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              exit={{ opacity: 0 }}
              className="pixel-card px-6 py-10 text-center"
            >
              <PixelIcon name="dice" size={4} className="mx-auto text-pink-deep" />
              <p className="mt-4 font-pixel text-xl text-ink">pick one to start</p>
              <p className="mt-1 text-ink-soft">No skipping. You know the rules.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Moments */}
      <section className="mt-14">
        <h2 className="page-title text-center text-4xl md:text-4xl">Our moments</h2>
        <p className="page-sub text-center">the rounds we never want to forget</p>

        {moments.length === 0 ? (
          <p className="pixel-card mx-auto mt-6 max-w-md px-6 py-6 text-center text-ink-soft">
            When a round turns into a moment, tap “keep it” and it’ll show up here and
            in the Vault.
          </p>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {moments.map((m) => (
              <li key={m.id} className="pixel-card px-5 py-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 font-pixel text-xs text-ink ${
                      m.tag === "truth" ? "bg-pink" : "bg-lav"
                    }`}
                  >
                    {m.tag}
                  </span>
                  <span className="font-pixel text-sm text-ink-soft">{prettyDate(m.date)}</span>
                </div>
                <p className="mt-2 font-bold text-ink">{m.title}</p>
                {m.note && <p className="mt-1 whitespace-pre-line text-ink-soft">{m.note}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Your own cards */}
      <section className="mt-14 text-center">
        <h2 className="page-title text-4xl md:text-4xl">Your own cards</h2>
        <p className="page-sub">add the inside jokes only we get</p>
        <button onClick={() => setAddOpen(true)} className="pixel-btn pixel-btn-paper mt-6">
          + Add a card
        </button>

        {yours.length > 0 && (
          <ul className="mx-auto mt-6 max-w-md space-y-3 text-left">
            {yours.map(({ kind, text }) => (
              <li key={kind + text} className="pixel-card flex items-center gap-3 py-2 pl-4 pr-1">
                <span
                  className={`px-2 py-0.5 font-pixel text-xs text-ink ${
                    kind === "truth" ? "bg-pink" : "bg-lav"
                  }`}
                >
                  {kind}
                </span>
                <span className="flex-1 text-ink">{text}</span>
                <button
                  onClick={() => removeCustom(kind, text)}
                  className="icon-button"
                  aria-label={`Remove ${text}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Keep a moment */}
      <Sheet
        open={keepOpen}
        onClose={closeKeep}
        title="Keep this moment"
        subtitle={card?.text}
        footer={
          <>
            <button className="pixel-btn pixel-btn-paper flex-1" onClick={closeKeep}>
              Cancel
            </button>
            <button className="pixel-btn flex-1" onClick={keepMoment}>
              Save
            </button>
          </>
        }
      >
        <label htmlFor="tod-note" className="field-label">
          What happened?
        </label>
        <textarea
          id="tod-note"
          value={keepNote}
          onChange={(e) => setKeepNote(e.target.value)}
          placeholder="The answer, the dare, the laugh…"
          className="field min-h-[120px] resize-y"
        />
        <p className="mt-3 text-sm text-ink-soft">It also gets saved in the Vault.</p>
      </Sheet>

      {/* Add a card */}
      <Sheet
        open={addOpen}
        onClose={closeAdd}
        title="New card"
        footer={
          <>
            <button className="pixel-btn pixel-btn-paper flex-1" onClick={closeAdd}>
              Cancel
            </button>
            <button className="pixel-btn flex-1" onClick={addPrompt} disabled={!addText.trim()}>
              Add
            </button>
          </>
        }
      >
        <div className="mb-5 flex gap-1 bg-paper p-1 outline-3 outline-line/30">
          {(["truth", "dare"] as Kind[]).map((k) => (
            <button
              key={k}
              onClick={() => setAddKind(k)}
              aria-pressed={addKind === k}
              className={`flex-1 cursor-pointer py-2 font-pixel text-lg transition-colors ${
                addKind === k ? (k === "truth" ? "bg-pink" : "bg-lav") + " text-ink" : "text-ink-soft"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
        <label htmlFor="tod-text" className="field-label">
          {addKind === "truth" ? "The question" : "The dare"}
        </label>
        <textarea
          id="tod-text"
          value={addText}
          onChange={(e) => setAddText(e.target.value)}
          className="field min-h-[100px] resize-y"
        />
      </Sheet>
    </main>
  );
}
