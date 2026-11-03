export type Memory = {
  id: string;
  title: string;
  date: string;
  note: string;
  createdAt: number;
  // set on moments saved from the Truth or Dare game
  tag?: "truth" | "dare";
};

// Don't rename: her saved memories live under this key
export const MEMORIES_KEY = "arunima_memories_v1";

export function readMemories(): Memory[] {
  try {
    const raw = localStorage.getItem(MEMORIES_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function writeMemories(memories: Memory[]) {
  localStorage.setItem(MEMORIES_KEY, JSON.stringify(memories));
}

export function todayISO() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
