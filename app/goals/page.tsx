"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Pencil, Search, Trash2, X } from "lucide-react";
import { PixelIcon } from "@/components/Pixel";
import Sheet from "@/components/Sheet";
import Constellation from "@/components/Constellation";
import { dateToSortValue, prettyDate } from "@/lib/dates";
import { bunnies } from "@/lib/bunnies";

type GoalStatus = "Not Started" | "In Progress" | "Achieved";
type FilterMode = "All" | "Active" | "Achieved";
type SortMode = "Progress" | "Date";

type Milestone = {
  id: string;
  text: string;
  done: boolean;
};

type Goal = {
  id: string;
  title: string;
  targetDate: string;
  status: GoalStatus;
  progress: number; // 0..100
  futureMessage: string;
  milestones: Milestone[];
  createdAt: number;
  achievedAt?: number;
};

// Don't rename: her saved goals live under this key
const STORAGE_KEY = "arunima_goals_v2";

// Goals without milestones are drawn with this many stars, lit by progress
const DEFAULT_STARS = 5;

function safeParseGoals(raw: string | null): Goal[] {
  try {
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data;
  } catch {
    return [];
  }
}

function litStars(goal: Goal) {
  if (goal.milestones?.length) return goal.milestones.map((m) => m.done);
  const on = Math.round(((goal.progress ?? 0) / 100) * DEFAULT_STARS);
  return Array.from({ length: DEFAULT_STARS }, (_, i) => i < on);
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex flex-1 bg-paper p-1 outline-3 outline-line/30"
    >
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={value === o}
          onClick={() => onChange(o)}
          className={`flex-1 cursor-pointer whitespace-nowrap px-2 py-2 font-pixel text-base transition-colors ${
            value === o ? "bg-pink text-ink" : "text-ink-soft"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function GoalsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // edit mode
  const [editingId, setEditingId] = useState<string | null>(null);

  // list controls
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("All");
  const [sort, setSort] = useState<SortMode>("Progress");

  // celebration modal
  const [celebrate, setCelebrate] = useState<null | { title: string }>(null);

  // form fields
  const [title, setTitle] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [status, setStatus] = useState<GoalStatus>("Not Started");
  const [progress, setProgress] = useState<number>(0);
  const [futureMessage, setFutureMessage] = useState("");
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [milestoneText, setMilestoneText] = useState("");

  const openAddModal = () => {
    setEditingId(null);
    setTitle("");
    setTargetDate("");
    setStatus("Not Started");
    setProgress(0);
    setFutureMessage("");
    setMilestones([]);
    setMilestoneText("");
    setIsOpen(true);
  };

  const openEditModal = (goal: Goal) => {
    setEditingId(goal.id);
    setTitle(goal.title);
    setTargetDate(goal.targetDate === "No date" ? "" : goal.targetDate);
    setStatus(goal.status);
    setProgress(goal.progress ?? 0);
    setFutureMessage(goal.futureMessage ?? "");
    setMilestones(goal.milestones ?? []);
    setMilestoneText("");
    setIsOpen(true);
  };

  const closeModal = useCallback(() => setIsOpen(false), []);

  // Load
  useEffect(() => {
    setGoals(safeParseGoals(localStorage.getItem(STORAGE_KEY)));
    setLoaded(true);
  }, []);

  // Save (only after loading, so an empty first render never overwrites her goals)
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  }, [goals, loaded]);

  // Auto-open modal from /goals?new=1
  useEffect(() => {
    const shouldOpen = searchParams.get("new") === "1";
    if (shouldOpen) {
      openAddModal();
      router.replace("/goals"); // clean url
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Milestones inside modal
  const addMilestone = () => {
    if (!milestoneText.trim()) return;
    const m: Milestone = {
      id: crypto.randomUUID(),
      text: milestoneText.trim(),
      done: false,
    };
    setMilestones((prev) => [...prev, m]);
    setMilestoneText("");
  };

  const removeMilestoneFromModal = (id: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  };

  const toggleMilestoneDoneInModal = (id: string) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, done: !m.done } : m)),
    );
  };

  const computedProgressFromMilestones = (ms: Milestone[], fallback: number) => {
    if (ms.length === 0) return fallback;
    return Math.round((ms.filter((m) => m.done).length / ms.length) * 100);
  };

  const saveGoal = () => {
    if (!title.trim()) return;

    const computedProgress = computedProgressFromMilestones(milestones, progress);

    // ADD
    if (!editingId) {
      const newGoal: Goal = {
        id: crypto.randomUUID(),
        title: title.trim(),
        targetDate: targetDate.trim() || "No date",
        status,
        progress: Math.max(0, Math.min(100, computedProgress)),
        futureMessage: futureMessage.trim(),
        milestones,
        createdAt: Date.now(),
      };

      setGoals((prev) => [newGoal, ...prev]);
      setIsOpen(false);
      return;
    }

    // EDIT
    setGoals((prev) =>
      prev.map((g) =>
        g.id === editingId
          ? {
              ...g,
              title: title.trim(),
              targetDate: targetDate.trim() || "No date",
              status,
              progress: Math.max(0, Math.min(100, computedProgress)),
              futureMessage: futureMessage.trim(),
              milestones,
              achievedAt:
                status === "Achieved" ? (g.achievedAt ?? Date.now()) : undefined,
            }
          : g,
      ),
    );

    setIsOpen(false);
  };

  // Toggle achieved (with celebration)
  const toggleAchieved = (goal: Goal) => {
    if (goal.status !== "Achieved") {
      setCelebrate({ title: goal.title });
      bunnies({ type: "celebrate" });
    }
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goal.id) return g;
        if (g.status === "Achieved") {
          return { ...g, status: "In Progress", achievedAt: undefined };
        }
        return { ...g, status: "Achieved", progress: 100, achievedAt: Date.now() };
      }),
    );
  };

  const deleteGoal = (id: string) => {
    if (!confirm("Let this goal go?")) return;
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  // Toggle milestone (on card)
  const toggleMilestoneDone = (goalId: string, milestoneId: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;

        const updated = g.milestones.map((m) =>
          m.id === milestoneId ? { ...m, done: !m.done } : m,
        );

        let newProgress = g.progress;
        if (updated.length > 0) {
          newProgress = Math.round(
            (updated.filter((m) => m.done).length / updated.length) * 100,
          );
        }

        return { ...g, milestones: updated, progress: newProgress };
      }),
    );
  };

  // Filter/Search
  const filteredGoals = useMemo(() => {
    const s = search.trim().toLowerCase();
    let data = [...goals];

    if (filter === "Active") data = data.filter((g) => g.status !== "Achieved");
    if (filter === "Achieved") data = data.filter((g) => g.status === "Achieved");

    if (s) {
      data = data.filter((g) => {
        const inTitle = g.title.toLowerCase().includes(s);
        const inMsg = (g.futureMessage || "").toLowerCase().includes(s);
        const inMilestones = (g.milestones || []).some((m) =>
          m.text.toLowerCase().includes(s),
        );
        return inTitle || inMsg || inMilestones;
      });
    }

    return data;
  }, [goals, search, filter]);

  const sortedGoals = useMemo(() => {
    const rank = (s: GoalStatus) =>
      s === "Achieved" ? 2 : s === "In Progress" ? 1 : 0;

    if (sort === "Date") {
      return [...filteredGoals].sort((a, b) => {
        const da = dateToSortValue(a.targetDate);
        const db = dateToSortValue(b.targetDate);
        if (da !== db) return da - db;
        return b.createdAt - a.createdAt;
      });
    }

    return [...filteredGoals].sort((a, b) => {
      const r = rank(a.status) - rank(b.status);
      if (r !== 0) return r;
      return b.createdAt - a.createdAt;
    });
  }, [filteredGoals, sort]);

  const statusPill = (s: GoalStatus) =>
    s === "Achieved"
      ? "bg-pink text-ink"
      : s === "In Progress"
        ? "bg-lav/60 text-ink"
        : "bg-ink/5 text-ink-soft";

  return (
    <main className="page">
      <header className="text-center">
        <h1 className="page-title">Goals</h1>
        <p className="page-sub">every step you finish lights up a star</p>
      </header>

      {/* Controls */}
      <div className="mt-10 flex flex-col gap-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-ink-soft"
            aria-hidden
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search goals…"
            aria-label="Search goals"
            className="field pl-11"
          />
        </div>

        <div className="flex items-start gap-3">
          <Segmented
            label="Show"
            options={["All", "Active", "Achieved"] as FilterMode[]}
            value={filter}
            onChange={setFilter}
          />
          <button onClick={openAddModal} className="pixel-btn -mt-[3px] px-4">
            + Add
          </button>
        </div>

        <button
          onClick={() => setSort((s) => (s === "Progress" ? "Date" : "Progress"))}
          className="self-center cursor-pointer px-3 py-1.5 font-pixel text-base text-ink"
        >
          sorted by{" "}
          <span className="text-pink-deep underline underline-offset-4">
            {sort === "Progress" ? "progress" : "target date"}
          </span>
        </button>
      </div>

      {/* Goals */}
      <section className="mt-8 space-y-5">
        {!loaded ? null : sortedGoals.length === 0 ? (
          <div className="pixel-card px-6 py-10 text-center">
            <PixelIcon name="star" size={4} className="mx-auto text-pink-deep" />
            <p className="mt-4 font-pixel text-2xl text-ink">
              {goals.length ? "no goals here" : "no goals yet"}
            </p>
            <p className="mt-2 text-ink-soft">
              Add one small intention and let it grow.
            </p>
          </div>
        ) : (
          sortedGoals.map((goal, i) => {
            const achieved = goal.status === "Achieved";
            return (
              <article
                key={goal.id}
                className="animate-pop pixel-card px-5 py-5"
                style={{ "--delay": `${Math.min(i, 8) * 0.06}s` } as React.CSSProperties}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold leading-snug text-ink">
                      {goal.title}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                      <span className={`px-2 py-0.5 font-pixel ${statusPill(goal.status)}`}>
                        {goal.status}
                      </span>
                      {goal.targetDate !== "No date" && (
                        <span className="text-ink-soft">
                          by {prettyDate(goal.targetDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="font-pixel text-2xl tabular-nums text-pink-deep">
                    {goal.progress}%
                  </span>
                </div>

                <div className="my-5">
                  <Constellation id={goal.id} lit={litStars(goal)} achieved={achieved} />
                </div>

                {/* Milestones */}
                {goal.milestones?.length > 0 && (
                  <ul className="space-y-1">
                    {goal.milestones.map((m) => (
                      <li key={m.id}>
                        <button
                          onClick={() => toggleMilestoneDone(goal.id, m.id)}
                          aria-pressed={m.done}
                          className="flex w-full cursor-pointer items-center gap-3 px-2 py-2 text-left transition-colors hover:bg-pink/20"
                        >
                          <PixelIcon
                            name="star"
                            size={2}
                            className={m.done ? "text-pink-deep" : "text-line/25"}
                          />
                          <span
                            className={m.done ? "text-ink-soft line-through" : "text-ink"}
                          >
                            {m.text}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Future message */}
                {goal.futureMessage?.trim() && (
                  <div className="mt-4 bg-pink/20 px-4 py-3">
                    <p className="font-pixel text-sm text-ink-soft">
                      if you ever feel like quitting
                    </p>
                    <p className="mt-1 leading-snug text-ink">
                      {goal.futureMessage}
                    </p>
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between gap-2">
                  <button
                    onClick={() => toggleAchieved(goal)}
                    className={achieved ? "pixel-btn pixel-btn-paper px-4 py-2.5 text-base" : "pixel-btn px-4 py-2.5 text-base"}
                  >
                    {achieved ? "Not done yet" : "I did it!"}
                  </button>
                  <div className="flex gap-1">
                    <button
                      className="icon-button"
                      onClick={() => openEditModal(goal)}
                      aria-label={`Edit ${goal.title}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      className="icon-button hover:text-destructive"
                      onClick={() => deleteGoal(goal.id)}
                      aria-label={`Delete ${goal.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>

      {/* Add/Edit */}
      <Sheet
        open={isOpen}
        onClose={closeModal}
        title={editingId ? "Edit goal" : "New goal"}
        footer={
          <>
            <button className="pixel-btn pixel-btn-paper flex-1" onClick={closeModal}>
              Cancel
            </button>
            <button
              className="pixel-btn flex-1"
              onClick={saveGoal}
              disabled={!title.trim()}
            >
              {editingId ? "Save" : "Add goal"}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <label htmlFor="g-title" className="field-label">
              What are you reaching for?
            </label>
            <input
              id="g-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Read 20 books this year"
              className="field"
            />
          </div>

          <div>
            <label htmlFor="g-date" className="field-label">
              By when?
            </label>
            <input
              id="g-date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              placeholder="2026-12-01 or Dec 2026"
              className="field"
            />
          </div>

          <div>
            <span className="field-label">Status</span>
            <div className="flex">
              <Segmented
                label="Status"
                options={["Not Started", "In Progress", "Achieved"] as GoalStatus[]}
                value={status}
                onChange={setStatus}
              />
            </div>
          </div>

          {/* Milestones */}
          <div>
            <label htmlFor="g-milestone" className="field-label">
              Steps (each one is a star)
            </label>
            <div className="flex gap-2">
              <input
                id="g-milestone"
                value={milestoneText}
                onChange={(e) => setMilestoneText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addMilestone();
                  }
                }}
                placeholder="Finish the first book"
                className="field"
              />
              <button
                type="button"
                className="pixel-btn pixel-btn-lav shrink-0 px-4"
                onClick={addMilestone}
              >
                Add
              </button>
            </div>

            {milestones.length > 0 && (
              <ul className="mt-3 space-y-1">
                {milestones.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-2 bg-pink/15 pl-2"
                  >
                    <button
                      type="button"
                      onClick={() => toggleMilestoneDoneInModal(m.id)}
                      aria-pressed={m.done}
                      className="flex flex-1 cursor-pointer items-center gap-3 py-2 text-left"
                    >
                      <PixelIcon
                        name="star"
                        size={2}
                        className={m.done ? "text-pink-deep" : "text-line/25"}
                      />
                      <span className={m.done ? "text-ink-soft line-through" : ""}>
                        {m.text}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeMilestoneFromModal(m.id)}
                      className="icon-button h-9 w-9"
                      aria-label={`Remove ${m.text}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Progress slider only matters without milestones */}
          {milestones.length === 0 && (
            <div>
              <div className="field-label flex items-center justify-between">
                <label htmlFor="g-progress">Progress</label>
                <span className="text-pink-deep">{progress}%</span>
              </div>
              <input
                id="g-progress"
                type="range"
                min={0}
                max={100}
                step={5}
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full accent-[var(--pink-deep)]"
              />
            </div>
          )}

          <div>
            <label htmlFor="g-message" className="field-label">
              A message for future you
            </label>
            <textarea
              id="g-message"
              value={futureMessage}
              onChange={(e) => setFutureMessage(e.target.value)}
              placeholder="If you ever feel like quitting…"
              className="field min-h-[100px] resize-y"
            />
          </div>
        </div>
      </Sheet>

      {/* Celebration */}
      <AnimatePresence>
        {celebrate && (
          <motion.div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-ink/40 px-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCelebrate(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Goal achieved"
              onClick={(e) => e.stopPropagation()}
              className="pixel-card relative w-full max-w-sm px-6 py-8 text-center"
              initial={{ scale: 0.85, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", damping: 18, stiffness: 220 }}
            >
              {/* burst of stars */}
              {Array.from({ length: 12 }, (_, i) => {
                const a = (i / 12) * Math.PI * 2;
                return (
                  <motion.span
                    key={i}
                    aria-hidden
                    className="absolute left-1/2 top-10 text-pink-deep"
                    initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
                    animate={{
                      x: Math.cos(a) * 130,
                      y: Math.sin(a) * 90,
                      opacity: 0,
                      scale: 1.2,
                    }}
                    transition={{ duration: 1.4, ease: "easeOut" }}
                  >
                    <PixelIcon name="heart" size={2} />
                  </motion.span>
                );
              })}

              <PixelIcon name="star" size={6} className="mx-auto text-pink-deep" />
              <p className="mt-4 font-pixel text-2xl text-ink">you did it!</p>
              <h2 className="mt-2 text-xl font-bold text-ink">{celebrate.title}</h2>
              <p className="mt-3 text-ink-soft">So, so proud of you.</p>
              <button
                onClick={() => setCelebrate(null)}
                className="pixel-btn mt-6 w-[calc(100%-6px)]"
              >
                Yay
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function GoalsPage() {
  return (
    <Suspense fallback={null}>
      <GoalsPageContent />
    </Suspense>
  );
}
