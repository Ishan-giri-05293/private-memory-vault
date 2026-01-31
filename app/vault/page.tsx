"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Plus,
  Trash2,
  Pencil,
  Search,
  CalendarDays,
  List,
  X,
  Image as ImageIcon,
  Video,
} from "lucide-react";

type ViewMode = "List" | "Timeline";

type Memory = {
  id: string;
  title: string;
  date: string;
  note: string;
  createdAt: number;
};

const STORAGE_KEY = "arunima_memories_v1";

function safeParse(raw: string | null): Memory[] {
  try {
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function dateToSortValue(date: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const t = new Date(date).getTime();
    return isNaN(t) ? Number.POSITIVE_INFINITY : t;
  }
  return Number.POSITIVE_INFINITY;
}

export default function VaultPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");

  // media (UI only for now, no storage)
  const [mediaType, setMediaType] = useState<"none" | "image" | "video">("none");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("List");

  // Load
  useEffect(() => {
    setMemories(safeParse(localStorage.getItem(STORAGE_KEY)));
  }, []);

  // Save
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
  }, [memories]);

  const openAdd = () => {
    setEditingId(null);
    setTitle("");
    setDate("");
    setNote("");
    setMediaType("none");
    setMediaPreview(null);
    setIsOpen(true);
  };

  const openEdit = (m: Memory) => {
    setEditingId(m.id);
    setTitle(m.title);
    setDate(m.date === "No date" ? "" : m.date);
    setNote(m.note);
    setMediaType("none");
    setMediaPreview(null);
    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);

  const onPickMedia = (file: File | null) => {
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isVideo && !isImage) return;

    const url = URL.createObjectURL(file);
    setMediaPreview(url);
    setMediaType(isVideo ? "video" : "image");
  };

  const clearMedia = () => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaPreview(null);
    setMediaType("none");
  };

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
    clearMedia();
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

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-6 pt-20 pb-20 max-w-5xl space-y-10">
        {/* Header */}
        <div className="space-y-3">
          <h2 className="text-3xl md:text-4xl font-light text-foreground">
            Your Memory Vault
          </h2>

          <p className="text-base font-light text-muted-foreground max-w-2xl leading-relaxed">
            Each moment preserved with care. A collection that grows with you.
          </p>

          {/* QUALITY FILTER LINE */}
          <p className="text-sm font-light text-foreground/70">
            Only save what you want to remember forever.
          </p>
        </div>

        {/* Controls (phone first layout) */}
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search memories…"
              className="w-full pl-9 pr-3 py-3 border border-border rounded-lg outline-none focus:ring-2 focus:ring-neutral-200"
            />
          </div>

          {/* Buttons row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={openAdd}
              className="w-full sm:w-auto bg-primary text-primary-foreground hover:opacity-90 hover:opacity-90 rounded-lg py-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Memory
            </Button>

            <Button
              variant="outline"
              className="w-full sm:w-auto border-border bg-transparent hover:bg-accent/50 rounded-lg py-6"
              onClick={() => setView(view === "List" ? "Timeline" : "List")}
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
          </div>
        </div>

        {/* Empty */}
        {sorted.length === 0 ? (
          <Card className="p-10 text-center border-border">
            <p className="text-foreground font-light">No memories yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Start with one moment you’d want to keep forever.
            </p>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((m) => (
              <Card
                key={m.id}
                className="p-7 bg-card hover:bg-accent/30 border-border transition-all"
              >
                <div className="space-y-4">
                  {/* Placeholder for future media */}
                  <div className="aspect-[4/3] bg-muted/30 rounded-lg flex items-center justify-center">
                    <span className="text-xs text-muted-foreground font-light">
                      Media will live here
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-light text-foreground">
                      {m.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{m.date}</p>
                  </div>

                  {m.note && (
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      {m.note}
                    </p>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="border-border bg-transparent hover:bg-accent/50"
                      onClick={() => openEdit(m)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="border-border bg-transparent hover:bg-accent/50"
                      onClick={() => deleteMemory(m.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Add/Edit Modal (phone-first) */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-end sm:items-center justify-center">
          <div className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl border border-border shadow-lg p-5 sm:p-6">
            <div className="flex justify-between items-start gap-3 mb-5">
              <div>
                <h3 className="text-lg font-light text-foreground">
                  {editingId ? "Edit memory" : "Add a memory"}
                </h3>
                <p className="text-xs text-muted-foreground font-light mt-1">
                  Save only what you want to remember forever.
                </p>
              </div>

              <button
                onClick={closeModal}
                className="p-2 rounded-md hover:bg-neutral-100 text-neutral-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Media picker (UI only for now) */}
            <div className="space-y-3 mb-5">
              <p className="text-xs font-light text-muted-foreground">
                Photos & videos (coming soon)
              </p>

              <div className="flex gap-3">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onPickMedia(e.target.files?.[0] || null)}
                  />
                  <div className="w-full border border-border rounded-lg py-3 flex items-center justify-center gap-2 hover:bg-accent/40">
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-sm font-light">Photo</span>
                  </div>
                </label>

                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => onPickMedia(e.target.files?.[0] || null)}
                  />
                  <div className="w-full border border-border rounded-lg py-3 flex items-center justify-center gap-2 hover:bg-accent/40">
                    <Video className="w-4 h-4" />
                    <span className="text-sm font-light">Video</span>
                  </div>
                </label>
              </div>

              {mediaPreview && (
                <div className="border border-border rounded-xl overflow-hidden">
                  {mediaType === "image" ? (
                    <img src={mediaPreview} alt="preview" className="w-full" />
                  ) : (
                    <video src={mediaPreview} controls className="w-full" />
                  )}

                  <div className="px-3 py-2 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Preview only (upload enabled later)
                    </p>
                    <button
                      onClick={clearMedia}
                      className="text-xs text-neutral-600 hover:text-foreground"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Fields */}
            <div className="space-y-4">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Memory title"
                className="w-full px-3 py-3 border border-border rounded-lg outline-none focus:ring-2 focus:ring-neutral-200"
              />

              <input
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="Date (ex: 2024-03-15 or March 2024)"
                className="w-full px-3 py-3 border border-border rounded-lg outline-none focus:ring-2 focus:ring-neutral-200"
              />

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="A short note (optional)"
                className="w-full min-h-[100px] px-3 py-3 border border-border rounded-lg outline-none focus:ring-2 focus:ring-neutral-200"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1 border-border bg-transparent hover:bg-accent/50 py-6 rounded-lg"
                onClick={closeModal}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-primary text-primary-foreground hover:opacity-90 hover:opacity-90 py-6 rounded-lg"
                onClick={saveMemory}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
