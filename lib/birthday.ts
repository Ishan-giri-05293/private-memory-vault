// Aru's birthday, 31 January. A new gift opens every few hours, all day long.
// All the words are yours to change.
//
// To preview it on any day, open the site with  ?preview-birthday=1
// (add &hour=14 to pretend it's 2pm). Turn it off with ?preview-birthday=0

import { ARU_BIRTHDAY } from "@/lib/bunnies";

export type Gift =
  | { id: string; hour: number; title: string; kind: "letter"; greeting: string; paragraphs: string[]; closing?: string[] }
  | { id: string; hour: number; title: string; kind: "rules"; intro: string; rules: string[] }
  | { id: string; hour: number; title: string; kind: "reasons"; intro: string; reasons: string[] }
  | { id: string; hour: number; title: string; kind: "memories"; intro: string; empty: string }
  | { id: string; hour: number; title: string; kind: "coupons"; intro: string; coupons: string[] }
  | { id: string; hour: number; title: string; kind: "wish"; intro: string; after: string; saved: string };

export const GIFTS: Gift[] = [
  {
    id: "midnight",
    hour: 0,
    title: "It's midnight",
    kind: "letter",
    greeting: "Happy birthday, my Aru,",
    paragraphs: [
      "It's 12 o'clock and I wanted to be the very first one to say it. Happy birthday, baby.",
      "Today is all about you. Not your to-do list, not anyone else's problems. Just you, and how loved you are.",
      "I've hidden little gifts in here for you, all day long. A new one opens every few hours, so keep coming back. The bunnies will remind you.",
      "Now go to sleep, birthday girl. The best part hasn't even started yet.",
    ],
  },
  {
    id: "rules",
    hour: 8,
    title: "Good morning, birthday girl",
    kind: "rules",
    intro: "Before your day starts, here are the official birthday rules. They are legally binding. I checked.",
    rules: [
      "You are not allowed to be sad today. If you are, call me and I'll fix it.",
      "You get the last bite of everything.",
      "Every argument today is automatically won by you.",
      "You have to eat cake. Minimum one piece. No negotiations.",
      "Look in the mirror at least once and say \"I'm the best.\" Because you are.",
      "Any \"no\" from me today counts as a \"yes\".",
      "You're allowed to be as dramatic as you want. It's your day.",
      "Keep checking back here. There's more.",
    ],
  },
  {
    id: "reasons",
    hour: 11,
    title: "Reasons I love you",
    kind: "reasons",
    intro: "Tap to read them one by one. (There are way more, but the website ran out of space.)",
    reasons: [
      "The way you laugh at your own jokes before you even finish them.",
      "You make ordinary days feel like something.",
      "You care about people so much, even when you pretend you don't.",
      "Your good morning texts.",
      "How excited you get about small things.",
      "You're the first person I want to tell everything to.",
      "You make me want to be better, without ever asking me to.",
      "Your face when you're sleepy.",
      "You remember the little things I say.",
      "You're stubborn in the best way.",
      "You make me laugh when I really don't want to.",
      "You're beautiful, and you don't even try.",
      "The way you say my name when you're annoyed with me.",
      "You never let me give up on myself.",
      "Truth or dare with you is never just a game.",
      "You feel like home.",
      "You're braver than you think you are.",
      "Every day since 1 January 2025 has been better because of you.",
      "You're my best friend and my favourite person at the same time.",
      "Because you're you. That's the whole reason, really.",
    ],
  },
  {
    id: "memories",
    hour: 14,
    title: "Memory lane",
    kind: "memories",
    intro: "A few moments from your Vault. Look how far we've come.",
    empty: "Your Vault is still empty... so let's make today the very first memory in it.",
  },
  {
    id: "coupons",
    hour: 17,
    title: "Love coupons",
    kind: "coupons",
    intro: "Tap one to use it. No expiry dates. No refunds. Ishan must obey.",
    coupons: [
      "One free hug, any time, no questions asked",
      "You pick the movie and I'm not allowed to complain",
      "One long drive, your playlist only",
      "Your favourite dessert, on me",
      "One \"I'm right\" card. Wins any argument instantly",
      "A whole day where I do whatever you want",
      "One surprise date, planned completely by me",
      "Unlimited forehead kisses",
    ],
  },
  {
    id: "wish",
    hour: 20,
    title: "Make a wish",
    kind: "wish",
    intro: "Blow out the candles. Tap each flame.",
    after: "Now make a wish. You can write it here if you want. Only you will ever see it.",
    saved: "Your wish is safe here. I hope every bit of it comes true.",
  },
  {
    id: "goodnight",
    hour: 23,
    title: "Goodnight, birthday girl",
    kind: "letter",
    greeting: "My Aru,",
    paragraphs: [
      "I hope today felt as special as you are. And if it didn't, tell me, because then I owe you a better one.",
      "Thank you for being born. Seriously. Thank you for being exactly who you are, and for letting me be a part of it.",
      "Another year of you is the best thing that could happen to this world. And to me.",
      "I love you. Today, tomorrow, and every birthday after this one.",
    ],
    closing: ["Happy birthday, baby."],
  },
];

// What the Ishan bunny says during the day
export const BIRTHDAY_CHATTER: { from: number; lines: string[] }[] = [
  { from: 0, lines: ["it's your birthday!! open your first gift", "first one to wish you!"] },
  { from: 6, lines: ["good morning birthday girl!", "did you read the birthday rules?"] },
  { from: 12, lines: ["have you had cake yet?", "happy birthday baby!", "a new gift opened, go look"] },
  { from: 17, lines: ["coupons are open... use them", "you're one year more amazing"] },
  { from: 21, lines: ["best day? tell me everything", "one more gift opens at 11"] },
];

// ---- time helpers -------------------------------------------------------

const PREVIEW_KEY = "aru_bday_preview_v1";

// Reads ?preview-birthday=1&hour=14 once and remembers it, so you can check the plan early
export function syncPreviewFromUrl() {
  try {
    const q = new URLSearchParams(window.location.search);
    const p = q.get("preview-birthday");
    if (p === "0") localStorage.removeItem(PREVIEW_KEY);
    else if (p) {
      const hour = q.get("hour");
      localStorage.setItem(PREVIEW_KEY, JSON.stringify({ hour: hour === null ? null : Number(hour) }));
    }
  } catch {}
}

export function isPreview() {
  try {
    return !!localStorage.getItem(PREVIEW_KEY);
  } catch {
    return false;
  }
}

// storage key for this year's birthday state (kept separate while previewing,
// so testing never spoils the real day)
export function birthdayKey(name: string, now = effectiveNow()) {
  return `aru_bday_${name}_${now.getFullYear()}${isPreview() ? "_preview" : ""}`;
}

// "now", except on the preview it's always her birthday
export function effectiveNow(): Date {
  const now = new Date();
  try {
    const raw = localStorage.getItem(PREVIEW_KEY);
    if (!raw) return now;
    const { hour } = JSON.parse(raw) as { hour: number | null };
    const d = new Date(now);
    d.setMonth(ARU_BIRTHDAY.month - 1, ARU_BIRTHDAY.day);
    if (hour !== null && !Number.isNaN(hour)) d.setHours(hour, 0, 0, 0);
    return d;
  } catch {
    return now;
  }
}

export function isBirthday(now = effectiveNow()) {
  return now.getMonth() + 1 === ARU_BIRTHDAY.month && now.getDate() === ARU_BIRTHDAY.day;
}

export function birthdayThisYear(now = effectiveNow()) {
  return new Date(now.getFullYear(), ARU_BIRTHDAY.month - 1, ARU_BIRTHDAY.day);
}

export function daysUntilBirthday(now = effectiveNow()) {
  let b = birthdayThisYear(now);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (b < today) b = new Date(now.getFullYear() + 1, ARU_BIRTHDAY.month - 1, ARU_BIRTHDAY.day);
  return Math.round((b.getTime() - today.getTime()) / 86_400_000);
}

export function birthdayChatter(now = effectiveNow()) {
  const h = now.getHours();
  const slot = [...BIRTHDAY_CHATTER].reverse().find((c) => h >= c.from) ?? BIRTHDAY_CHATTER[0];
  return slot.lines[Math.floor(Math.random() * slot.lines.length)];
}

export function formatHour(h: number) {
  if (h === 0) return "12:00 am";
  if (h === 12) return "12:00 pm";
  return h < 12 ? `${h}:00 am` : `${h - 12}:00 pm`;
}
