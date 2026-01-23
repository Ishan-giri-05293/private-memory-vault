"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Pencil,
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
  targetDate: string;
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

function dateToSortValue(targetDate: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
    const t = new Date(targetDate).getTime();
    return isNaN(t) ? Number.POSITIVE_INFINITY : t;
  }
  return Number.POSITIVE_INFINITY;
}

export default function GoalsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // edit mode
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const closeModal = () => setIsOpen(false);

  // ✅ Load
  useEffect(() => {
    const stored = safeParseGoals(localStorage.getItem(STORAGE_KEY));
    setGoals(stored);
  }, []);

  // ✅ Save
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  }, [goals]);

  // ✅ Auto-open modal from /goals?new=1
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
    setMilestones((prev) => [m, ...prev]);
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
  const toggleAchieved = (id: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;

        if (g.status === "Achieved") {
          return { ...g, status: "In Progress", achievedAt: undefined };
        }

        setCelebrate({ title: g.title });
        return {
          ...g,
          status: "Achieved",
          progress: 100,
          achievedAt: Date.now(),
        };
      }),
    );
  };

  const deleteGoal = (id: string) => {
    if (!confirm("Delete this goal?")) return;
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

    if (view === "Timeline") {
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

          {/* Controls (PHONE FIRST) */}
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search goals…"
                className="w-full pl-9 pr-3 py-3 border border-border rounded-lg outline-none focus:ring-2 focus:ring-neutral-200 bg-white"
              />
            </div>

            {/* Buttons row */}
            <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterMode)}
                className="w-full px-3 py-3 border border-border rounded-lg outline-none focus:ring-2 focus:ring-neutral-200 bg-white text-sm font-light"
              >
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Achieved">Achieved</option>
              </select>

              <Button
                variant="outline"
                className="w-full border-border bg-transparent hover:bg-accent/50 rounded-lg py-6"
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
                onClick={openAddModal}
                className="col-span-2 sm:col-span-1 w-full bg-black text-white hover:opacity-90 rounded-lg py-6"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Goal
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

                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          className="border-border bg-transparent hover:bg-accent/50"
                          onClick={() => openEditModal(goal)}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </Button>

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

      {/* Add/Edit Modal (BOTTOM SHEET on phone) */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-end sm:items-center justify-center">
          <div className="w-full sm:max-w-xl bg-white rounded-t-2xl sm:rounded-2xl border border-border shadow-lg p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="space-y-2">
                <h3 className="text-xl font-light text-foreground">
                  {editingId ? "Edit goal" : "Add a new goal"}
                </h3>
                <p className="text-sm font-light text-muted-foreground">
                  Keep it honest. Keep it yours.
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
                className="w-full px-3 py-3 border border-border rounded-lg outline-none focus:ring-2 focus:ring-neutral-200"
              />

              <input
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                placeholder="Target date (ex: 2026-12-01 or Dec 2026)"
                className="w-full px-3 py-3 border border-border rounded-lg outline-none focus:ring-2 focus:ring-neutral-200"
              />

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as GoalStatus)}
                className="w-full px-3 py-3 border border-border rounded-lg outline-none focus:ring-2 focus:ring-neutral-200"
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
                className="w-full min-h-[100px] px-3 py-3 border border-border rounded-lg outline-none focus:ring-2 focus:ring-neutral-200"
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
                    className="flex-1 px-3 py-3 border border-border rounded-lg outline-none focus:ring-2 focus:ring-neutral-200"
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
                        className="flex items-start justify-between gap-3 border border-border rounded-lg px-3 py-2"
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

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1 border-border bg-transparent hover:bg-accent/50 py-6 rounded-lg"
                onClick={closeModal}
              >
                Cancel
              </Button>
              <Button
                onClick={saveGoal}
                className="flex-1 bg-black text-white hover:opacity-90 py-6 rounded-lg"
              >
                {editingId ? "Save changes" : "Save goal"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Celebration */}
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
