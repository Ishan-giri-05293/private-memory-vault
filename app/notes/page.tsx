"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Envelope, Letter } from "@/components/Envelope";
import { PixelIcon } from "@/components/Pixel";
import { OPEN_WHEN, type OpenWhenNote } from "@/lib/letters";
import { bunnies } from "@/lib/bunnies";

const OPENED_KEY = "aru_opened_notes_v1";

function readOpened(): string[] {
  try {
    const data = JSON.parse(localStorage.getItem(OPENED_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default function NotesPage() {
  const [opened, setOpened] = useState<string[]>([]);
  const [active, setActive] = useState<OpenWhenNote | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setOpened(readOpened());
  }, []);

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

  const openNote = (note: OpenWhenNote) => {
    setRevealed(opened.includes(note.id));
    setActive(note);
  };

  const markOpened = (id: string) => {
    setRevealed(true);
    bunnies({ type: "hug" });
    setOpened((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem(OPENED_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  return (
    <main className="page">
      <header className="mb-10 text-center">
        <h1 className="page-title">Letters</h1>
        <p className="page-sub">open them only when the time is right</p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {OPEN_WHEN.map((note, i) => {
          const isOpened = opened.includes(note.id);
          return (
            <li
              key={note.id}
              className="animate-pop"
              style={{ "--delay": `${i * 0.05}s` } as React.CSSProperties}
            >
              <button
                onClick={() => openNote(note)}
                className="pixel-card flex w-[calc(100%-8px)] cursor-pointer items-center gap-4 px-5 py-4 text-left transition-transform hover:-translate-y-1 focus-visible:outline-3 focus-visible:outline-offset-6 focus-visible:outline-pink-deep"
              >
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center ${
                    isOpened ? "bg-lav/40 text-ink-soft" : "bg-pink/50 text-pink-deep"
                  }`}
                >
                  <PixelIcon name={isOpened ? "envelope" : "heart"} size={3} />
                </span>
                <span>
                  <span className="block font-pixel text-sm text-ink-soft">open when</span>
                  <span className="block font-pixel text-xl leading-tight text-ink">
                    {note.when}
                  </span>
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
            aria-label={`Open when ${active.when}`}
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
                  aria-label="Close letter"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="page-title mt-2 text-center text-4xl md:text-5xl">
                open when {active.when}
              </p>

              <div className="mt-10">
                {revealed ? (
                  <Letter greeting="Hey love," paragraphs={active.paragraphs} />
                ) : (
                  <Envelope onOpened={() => markOpened(active.id)} />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
