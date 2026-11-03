"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Search, Trash2 } from "lucide-react";
import Sheet from "@/components/Sheet";
import { PixelIcon } from "@/components/Pixel";
import { dateToSortValue, prettyDate } from "@/lib/dates";
import { readMemories, writeMemories, type Memory } from "@/lib/memories";

type ViewMode = "List" | "Timeline";

export default function VaultPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");

  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("List");

  // Load
  useEffect(() => {
    setMemories(readMemories());
    setLoaded(true);
  }, []);

  // Save (only after loading, so an empty first render never overwrites her memories)
  useEffect(() => {
    if (!loaded) return;
    writeMemories(memories);
  }, [memories, loaded]);

  const openAdd = () => {
    setEditingId(null);
    setTitle("");
    setDate("");
    setNote("");
    setIsOpen(true);
  };

  const openEdit = (m: Memory) => {
    setEditingId(m.id);
    setTitle(m.title);
    setDate(m.date === "No date" ? "" : m.date);
    setNote(m.note);
    setIsOpen(true);
  };

  const closeModal = useCallback(() => setIsOpen(false), []);

  const saveMemory = () => {
    if (!title.trim()) return;

    if (!editingId) {
      const m: Memory = {
        id: crypto.randomUUID(),
        title: title.trim(),
        date: date.trim() || "No date",
        note: note.trim(),
        createdAt: Date.now(),
      };
      setMemories((prev) => [m, ...prev]);
    } else {
      setMemories((prev) =>
        prev.map((m) =>
          m.id === editingId
            ? {
                ...m,
                title: title.trim(),
                date: date.trim() || "No date",
                note: note.trim(),
              }
            : m
        )
      );
    }

    setIsOpen(false);
  };

  const deleteMemory = (id: string) => {
    if (!confirm("Delete this memory?")) return;
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    return memories.filter(
      (m) =>
        m.title.toLowerCase().includes(s) ||
        m.note.toLowerCase().includes(s) ||
        m.date.toLowerCase().includes(s)
    );
  }, [memories, search]);

  const sorted = useMemo(() => {
    if (view === "Timeline") {
      return [...filtered].sort(
        (a, b) => dateToSortValue(a.date) - dateToSortValue(b.date)
      );
    }
    return filtered;
  }, [filtered, view]);

  const memoryCard = (m: Memory) => (
    <article className="pixel-card flex h-[calc(100%-8px)] flex-col px-5 py-5">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-pixel text-base text-pink-deep">
          {m.date === "No date" ? "sometime" : prettyDate(m.date)}
        </p>
        {m.tag && (
          <span className="bg-lav/50 px-2 py-0.5 font-pixel text-xs text-ink">
            {m.tag === "truth" ? "truth" : "dare"}
          </span>
        )}
      </div>
      <h3 className="mt-1 text-lg font-bold leading-snug text-ink">{m.title}</h3>
      {m.note && (
        <p className="mt-2 whitespace-pre-line leading-relaxed text-ink-soft">{m.note}</p>
      )}
      <div className="mt-auto flex justify-end gap-1 pt-3">
        <button
          className="icon-button"
          onClick={() => openEdit(m)}
          aria-label={`Edit ${m.title}`}
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          className="icon-button hover:text-destructive"
          onClick={() => deleteMemory(m.id)}
          aria-label={`Delete ${m.title}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  );

  return (
    <main className="page max-w-5xl">
      <header className="text-center">
        <h1 className="page-title">Vault</h1>
        <p className="page-sub">only save what you want to remember forever</p>
      </header>

      {/* Controls */}
      <div className="mx-auto mt-10 flex max-w-2xl flex-col gap-4 sm:flex-row sm:items-start">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-ink-soft"
            aria-hidden
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search memories…"
            aria-label="Search memories"
            className="field pl-11"
          />
        </div>

        <div className="flex items-start gap-3">
          <div role="tablist" aria-label="View" className="flex flex-1 bg-paper p-1 outline-3 outline-line/30">
            {(["List", "Timeline"] as ViewMode[]).map((v) => (
              <button
                key={v}
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={`flex-1 cursor-pointer px-4 py-2 font-pixel text-base transition-colors ${
                  view === v ? "bg-pink text-ink" : "text-ink-soft"
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <button onClick={openAdd} className="pixel-btn -mt-[3px] px-4">
            + Add
          </button>
        </div>
      </div>

      {/* Memories */}
      <section className="mt-8">
        {!loaded ? null : sorted.length === 0 ? (
          <div className="pixel-card mx-auto max-w-md px-6 py-10 text-center">
            <PixelIcon name="heart" size={4} className="mx-auto text-pink" />
            <p className="mt-4 font-pixel text-2xl text-ink">
              {search ? "nothing found" : "nothing here yet"}
            </p>
            <p className="mt-2 text-ink-soft">
              {search
                ? "Try another word."
                : "Start with one moment you'd want to keep forever."}
            </p>
          </div>
        ) : view === "List" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((m, i) => (
              <div
                key={m.id}
                className="animate-pop"
                style={{ "--delay": `${Math.min(i, 8) * 0.05}s` } as React.CSSProperties}
              >
                {memoryCard(m)}
              </div>
            ))}
          </div>
        ) : (
          // Timeline: a dotted pixel path
          <ol className="relative mx-auto max-w-2xl space-y-5 pl-10">
            <span
              aria-hidden
              className="absolute bottom-2 left-[13px] top-2 w-1"
              style={{
                background:
                  "repeating-linear-gradient(to bottom, var(--paper) 0 8px, transparent 8px 16px)",
              }}
            />
            {sorted.map((m, i) => (
              <li
                key={m.id}
                className="animate-pop relative"
                style={{ "--delay": `${Math.min(i, 8) * 0.05}s` } as React.CSSProperties}
              >
                <span aria-hidden className="absolute -left-[36px] top-5 text-pink-deep">
                  <PixelIcon name="heart" size={2} />
                </span>
                {memoryCard(m)}
              </li>
            ))}
          </ol>
        )}
      </section>

      <Sheet
        open={isOpen}
        onClose={closeModal}
        title={editingId ? "Edit memory" : "New memory"}
        footer={
          <>
            <button className="pixel-btn pixel-btn-paper flex-1" onClick={closeModal}>
              Cancel
            </button>
            <button
              className="pixel-btn flex-1"
              onClick={saveMemory}
              disabled={!title.trim()}
            >
              Save
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <label htmlFor="m-title" className="field-label">
              What happened?
            </label>
            <input
              id="m-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Our first sunset together"
              className="field"
            />
          </div>

          <div>
            <label htmlFor="m-date" className="field-label">
              When?
            </label>
            <input
              id="m-date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="2025-03-15 or March 2025"
              className="field"
            />
          </div>

          <div>
            <label htmlFor="m-note" className="field-label">
              A little note
            </label>
            <textarea
              id="m-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What made it special…"
              className="field min-h-[110px] resize-y"
            />
          </div>

          <p className="text-sm text-ink-soft">Photos and videos are coming soon.</p>
        </div>
      </Sheet>
    </main>
  );
}
