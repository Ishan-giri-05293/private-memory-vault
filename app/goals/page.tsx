"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Search,
  List,
  CalendarDays,
  X,
} from "lucide-react";

type GoalStatus = "Not Started" | "In Progress" | "Achieved";
type FilterMode = "All" | "Active" | "Achieved";
type ViewMode = "List" | "Timeline";

type Milestone = {
  id: string;
  text: string;
  done: boolean;
};

type Goal = {
  id: string;
  title: string;
  targetDate: string; // keep as string (user friendly, ex: "Dec 2026" or "2026-12-01")
  status: GoalStatus;
  progress: number; // 0..100
  futureMessage: string;
  milestones: Milestone[];
  createdAt: number;
  achievedAt?: number;
};

const STORAGE_KEY = "arunima_goals_v2";

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

// Try to convert "YYYY-MM-DD" to timestamp for sorting timeline.
// If user uses "Dec 2026" etc, it will fall back to Infinity (end).
function dateToSortValue(targetDate: string) {
  // matches 2026-12-01
  if (/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
    const t = new Date(targetDate).getTime();
    return isNaN(t) ? Number.POSITIVE_INFINITY : t;
  }
  return Number.POSITIVE_INFINITY;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // list controls
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("All");
  const [view, setView] = useState<ViewMode>("List");

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

  // Load
  useEffect(() => {
    const stored = safeParseGoals(localStorage.getItem(STORAGE_KEY));
    setGoals(stored);
  }, []);

  // Save
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  }, [goals]);

  // Open/Close modal
  const openModal = () => {
    setTitle("");
    setTargetDate("");
    setStatus("Not Started");
    setProgress(0);
    setFutureMessage("");
    setMilestones([]);
    setMilestoneText("");
    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);

  // Add milestone inside modal
  const addMilestone = () => {
    if (!milestoneText.trim()) return;
    const m: Milestone = {
      id: crypto.randomUUID(),
      text: milestoneText.trim(),
      done: false,
    };
    setMilestones((prev) => [m, ...prev]);
    setMilestoneText("");
  };

  const removeMilestoneFromModal = (id: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  };

  const toggleMilestoneDoneInModal = (id: string) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, done: !m.done } : m))
    );
  };

  // Add goal
  const addGoal = () => {
    if (!title.trim()) return;

    const computedProgress =
      milestones.length > 0
        ? Math.round(
            (milestones.filter((m) => m.done).length / milestones.length) * 100
          )
        : progress;

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
  };

  // Toggle achieved (with celebration)
  const toggleAchieved = (id: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;

        if (g.status === "Achieved") {
          // un-achieve
          return { ...g, status: "In Progress", achievedAt: undefined };
        }

        // achieve
        setCelebrate({ title: g.title });
        return { ...g, status: "Achieved", progress: 100, achievedAt: Date.now() };
      })
    );
  };

  // Delete
  const deleteGoal = (id: string) => {
    if (!confirm("Delete this goal?")) return;
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  // Toggle milestone in list (after created)
  const toggleMilestoneDone = (goalId: string, milestoneId: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;

        const updated = g.milestones.map((m) =>
          m.id === milestoneId ? { ...m, done: !m.done } : m
        );

        // auto update progress if milestones exist
        let newProgress = g.progress;
        if (updated.length > 0) {
          newProgress = Math.round(
            (updated.filter((m) => m.done).length / updated.length) * 100
          );
        }

        // If progress hits 100 and not achieved, keep status In Progress unless user marks achieved.
        return { ...g, milestones: updated, progress: newProgress };
      })
    );
  };

  // Filter/Search
  const filteredGoals = useMemo(() => {
    const s = search.trim().toLowerCase();

    let data = [...goals];

    if (filter === "Active") {
      data = data.filter((g) => g.status !== "Achieved");
    } else if (filter === "Achieved") {
      data = data.filter((g) => g.status === "Achieved");
    }

    if (s) {
      data = data.filter((g) => {
        const inTitle = g.title.toLowerCase().includes(s);
        const inMsg = (g.futureMessage || "").toLowerCase().includes(s);
        const inMilestones = (g.milestones || []).some((m) =>
          m.text.toLowerCase().includes(s)
        );
        return inTitle || inMsg || inMilestones;
      });
    }

    return data;
  }, [goals, search, filter]);

  // Sort
  const sortedGoals = useMemo(() => {
    // achieved at bottom for List view
    const rank = (s: GoalStatus) =>
      s === "Achieved" ? 2 : s === "In Progress" ? 1 : 0;

    if (view === "Timeline") {
      // timeline: earliest date first, no-date at end
      return [...filteredGoals].sort((a, b) => {
        const da = dateToSortValue(a.targetDate);
        const db = dateToSortValue(b.targetDate);
        if (da !== db) return da - db;
        // fallback: createdAt newest first
        return b.createdAt - a.createdAt;
      });
    }

    // List: active first, then newest
    return [...filteredGoals].sort((a, b) => {
      const r = rank(a.status) - rank(b.status);
      if (r !== 0) return r;
      return b.createdAt - a.createdAt;
    });
  }, [filteredGoals, view]);

  const statusClass = (s: GoalStatus) => {
    if (s === "Achieved") return "text-foreground/70";
    if (s === "In Progress") return "text-foreground/70";
    return "text-muted-foreground";
  };

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-6 pt-20 pb-20 max-w-4xl">
        <div className="space-y-10">
          {/* Title */}
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-light text-foreground">
              Goals & Milestones
            </h2>
            <p className="text-base font-light text-muted-foreground leading-relaxed max-w-2xl">
              Quiet intentions. Patient progress. A reflection of who you're
              becoming.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            {/* Search */}
            <div className="relative w-full md:max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search goals…"
                className="w-full pl-9 pr-3 py-2 border border-border rounded-md outline-none focus:ring-2 focus:ring-neutral-200 bg-white"
              />
            </div>

            {/* Filter + View */}
            <div className="flex items-center gap-2 justify-between md:justify-end">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterMode)}
                className="px-3 py-2 border border-border rounded-md outline-none focus:ring-2 focus:ring-neutral-200 bg-white text-sm font-light"
              >
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Achieved">Achieved</option>
              </select>

              <Button
                variant="outline"
                className="border-border bg-transparent hover:bg-accent/50"
                onClick={() => setView((v) => (v === "List" ? "Timeline" : "List"))}
              >
                {view === "List" ? (
                  <>
                    <CalendarDays className="w-4 h-4 mr-2" /> Timeline
                  </>
                ) : (
                  <>
                    <List className="w-4 h-4 mr-2" /> List
                  </>
                )}
              </Button>

              <Button
                onClick={openModal}
                size="lg"
                variant="outline"
                className="border-border hover:bg-accent/50 text-foreground font-light text-sm px-5 py-5 gap-3 bg-transparent"
              >
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>
          </div>

          {/* Empty */}
          {sortedGoals.length === 0 ? (
            <Card className="p-10 bg-card border-border">
              <div className="space-y-2 text-center">
                <p className="text-base font-light text-foreground">
                  No goals found.
                </p>
                <p className="text-sm font-light text-muted-foreground">
                  Add one small intention and let it grow.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {sortedGoals.map((goal) => (
                <Card
                  key={goal.id}
                  className="p-8 bg-card hover:bg-accent/30 border-border transition-all"
                >
                  <div className="flex flex-col gap-5">
                    {/* Title row */}
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="space-y-2">
                        <h3 className="text-lg font-light text-foreground">
                          {goal.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-4 text-sm font-light text-muted-foreground">
                          <span>{goal.targetDate}</span>
                          <span className="text-border">•</span>
                          <span className={statusClass(goal.status)}>
                            {goal.status}
                          </span>
                          <span className="text-border">•</span>
                          <span>{goal.progress}%</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          className="border-border bg-transparent hover:bg-accent/50"
                          onClick={() => toggleAchieved(goal.id)}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          {goal.status === "Achieved"
                            ? "Mark In Progress"
                            : "Mark Achieved"}
                        </Button>

                        <Button
                          variant="outline"
                          className="border-border bg-transparent hover:bg-accent/50"
                          onClick={() => deleteGoal(goal.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden border border-border">
                      <div
                        className="h-full bg-neutral-900"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>

                    {/* Milestones */}
                    {goal.milestones?.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-light text-muted-foreground">
                          Milestones
                        </p>
                        <div className="space-y-2">
                          {goal.milestones.map((m) => (
                            <label
                              key={m.id}
                              className="flex items-start gap-3 text-sm font-light text-foreground/90 cursor-pointer select-none"
                            >
                              <input
                                type="checkbox"
                                checked={m.done}
                                onChange={() => toggleMilestoneDone(goal.id, m.id)}
                                className="mt-1"
                              />
                              <span className={m.done ? "line-through opacity-70" : ""}>
                                {m.text}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Future message */}
                    {goal.futureMessage?.trim() && (
                      <div className="pt-2">
                        <p className="text-sm font-light text-muted-foreground">
                          If you ever feel like quitting…
                        </p>
                        <p className="text-sm font-light text-foreground mt-1 leading-relaxed">
                          {goal.futureMessage}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Goal Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-xl bg-white rounded-xl border border-border shadow-lg p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="space-y-2">
                <h3 className="text-xl font-light text-foreground">
                  Add a new goal
                </h3>
                <p className="text-sm font-light text-muted-foreground">
                  Make it honest. Make it yours.
                </p>
              </div>

              <button
                onClick={closeModal}
                className="p-2 rounded-md hover:bg-neutral-100 text-neutral-600"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Goal title"
                className="w-full px-3 py-2 border border-border rounded-md outline-none focus:ring-2 focus:ring-neutral-200"
              />

              {/* You can keep it "Dec 2026" or set YYYY-MM-DD */}
              <input
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                placeholder="Target date (ex: 2026-12-01 or Dec 2026)"
                className="w-full px-3 py-2 border border-border rounded-md outline-none focus:ring-2 focus:ring-neutral-200"
              />

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as GoalStatus)}
                className="w-full px-3 py-2 border border-border rounded-md outline-none focus:ring-2 focus:ring-neutral-200"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Achieved">Achieved</option>
              </select>

              {/* Progress slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-light text-muted-foreground">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Future message */}
              <textarea
                value={futureMessage}
                onChange={(e) => setFutureMessage(e.target.value)}
                placeholder="Future message (optional) — If you ever feel like quitting..."
                className="w-full min-h-[90px] px-3 py-2 border border-border rounded-md outline-none focus:ring-2 focus:ring-neutral-200"
              />

              {/* Milestones */}
              <div className="space-y-3">
                <p className="text-sm font-light text-muted-foreground">
                  Milestones (optional)
                </p>

                <div className="flex gap-2">
                  <input
                    value={milestoneText}
                    onChange={(e) => setMilestoneText(e.target.value)}
                    placeholder="Add a milestone"
                    className="flex-1 px-3 py-2 border border-border rounded-md outline-none focus:ring-2 focus:ring-neutral-200"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="border-border bg-transparent hover:bg-accent/50"
                    onClick={addMilestone}
                  >
                    Add
                  </Button>
                </div>

                {milestones.length > 0 && (
                  <div className="space-y-2">
                    {milestones.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-start justify-between gap-3 border border-border rounded-md px-3 py-2"
                      >
                        <label className="flex items-start gap-3 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={m.done}
                            onChange={() => toggleMilestoneDoneInModal(m.id)}
                            className="mt-1"
                          />
                          <span className={m.done ? "line-through opacity-70" : ""}>
                            {m.text}
                          </span>
                        </label>

                        <button
                          onClick={() => removeMilestoneFromModal(m.id)}
                          className="text-neutral-500 hover:text-black"
                          aria-label="Remove milestone"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-8">
              <Button
                variant="outline"
                className="border-border bg-transparent hover:bg-accent/50"
                onClick={closeModal}
              >
                Cancel
              </Button>
              <Button
                onClick={addGoal}
                className="bg-black text-white hover:opacity-90"
              >
                Save goal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Celebration modal */}
      {celebrate && (
        <div className="fixed inset-0 z-[110] bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-white rounded-xl border border-border shadow-lg p-6 text-center">
            <p className="text-sm font-light text-muted-foreground">
              You kept a promise to yourself.
            </p>
            <h4 className="text-xl font-light text-foreground mt-2">
              {celebrate.title}
            </h4>
            <p className="text-sm font-light text-muted-foreground mt-3">
              Let this moment stay with you.
            </p>

            <div className="mt-6 flex justify-center">
              <Button
                onClick={() => setCelebrate(null)}
                className="bg-black text-white hover:opacity-90"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
