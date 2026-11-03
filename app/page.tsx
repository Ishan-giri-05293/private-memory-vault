"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PixelIcon, type SpriteName } from "@/components/Pixel";
import { daysTogether } from "@/lib/night";
import { isBirthday } from "@/lib/birthday";

const ROOMS: { href: string; icon: SpriteName; title: string; line: string }[] = [
  { href: "/vault", icon: "book", title: "Vault", line: "the moments we keep" },
  { href: "/truth-or-dare", icon: "dice", title: "Truth or Dare", line: "you know the rules" },
  { href: "/goals", icon: "star", title: "Goals", line: "things you're working on" },
  { href: "/notes", icon: "envelope", title: "Letters", line: "open when you need one" },
  { href: "/promise", icon: "heart", title: "Promise", line: "a letter from me" },
];

export default function HomePage() {
  // computed on the client so the count always matches her own clock
  const [days, setDays] = useState<number | null>(null);
  const [birthday, setBirthday] = useState(false);

  useEffect(() => {
    setDays(daysTogether());
    setBirthday(isBirthday());
  }, []);

  return (
    <main className="page flex flex-col items-center text-center">
      {birthday && (
        <Link
          href="/birthday"
          className="pixel-card animate-pop mb-8 flex w-full max-w-xl items-center gap-4 px-5 py-4 text-left [--b:var(--pink-deep)] hover:-translate-y-1 transition-transform"
        >
          <span className="animate-wiggle text-pink-deep">
            <PixelIcon name="gift" size={4} />
          </span>
          <span className="flex-1">
            <span className="block font-pixel text-xl text-ink">it&apos;s your birthday!!</span>
            <span className="block text-sm text-ink-soft">your gifts are waiting. a new one opens every few hours.</span>
          </span>
          <span className="font-pixel text-2xl text-pink-deep" aria-hidden>&gt;</span>
        </Link>
      )}
      <p className="animate-pop font-pixel text-xl text-ink">{birthday ? "happy birthday," : "hi Aru,"}</p>
      <h1
        className="page-title animate-pop mt-3 text-6xl md:text-7xl"
        style={{ "--delay": "0.1s" } as React.CSSProperties}
      >
        A Space
        <br />
        for You
      </h1>

      {/* Days together */}
      <div
        className="pixel-card animate-pop mt-10 w-full max-w-xs px-6 py-5"
        style={{ "--delay": "0.25s" } as React.CSSProperties}
      >
        <p className="font-pixel text-6xl leading-none text-pink-deep tabular-nums">
          {days ?? " "}
        </p>
        <p className="mt-2 font-pixel text-lg text-ink">days of us</p>
        <p className="mt-1 text-sm text-ink-soft">since 1 January 2025</p>
      </div>

      {/* Rooms */}
      <nav className="mt-10 grid w-full max-w-xl gap-3 sm:grid-cols-2">
        {ROOMS.map(({ href, icon, title, line }, i) => (
          <Link
            key={href}
            href={href}
            className={`pixel-card animate-pop group flex items-center gap-4 px-5 py-4 text-left transition-transform hover:-translate-y-1 focus-visible:outline-3 focus-visible:outline-offset-6 focus-visible:outline-pink-deep ${
              i === ROOMS.length - 1 ? "sm:col-span-2" : ""
            }`}
            style={{ "--delay": `${0.35 + i * 0.06}s` } as React.CSSProperties}
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-pink/40 text-pink-deep">
              <PixelIcon name={icon} size={3} />
            </span>
            <span className="flex-1">
              <span className="block font-pixel text-xl text-ink">{title}</span>
              <span className="block text-sm text-ink-soft">{line}</span>
            </span>
            <span className="font-pixel text-2xl text-ink-soft transition-transform group-hover:translate-x-1" aria-hidden>
              &gt;
            </span>
          </Link>
        ))}
      </nav>
    </main>
  );
}
