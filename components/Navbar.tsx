"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { PixelIcon, type SpriteName } from "@/components/Pixel";
import { isBirthday } from "@/lib/birthday";

const LINKS: { href: string; label: string; short: string; icon: SpriteName }[] = [
  { href: "/vault", label: "Vault", short: "Vault", icon: "book" },
  { href: "/goals", label: "Goals", short: "Goals", icon: "star" },
  { href: "/truth-or-dare", label: "Truth or Dare", short: "T or D", icon: "dice" },
  { href: "/notes", label: "Letters", short: "Letters", icon: "envelope" },
  { href: "/promise", label: "Promise", short: "Promise", icon: "heart" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [birthday, setBirthday] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    setBirthday(isBirthday());
    return () => unsub();
  }, []);

  if (!isLoggedIn || pathname === "/login") return null;

  const logout = async () => {
    await signOut(auth);
    document.cookie = "firebase-auth=; path=/; max-age=0";
    window.location.href = "/login";
  };

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <>
      {/* Top bar */}
      <nav className="sticky top-0 z-50 border-b-4 border-line bg-paper">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2">
          <Link
            href="/"
            className="flex items-center gap-2 px-1 py-2 font-pixel text-xl text-ink"
          >
            <PixelIcon name="heart" size={2} className="text-pink-deep" />
            A Space for You
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={`px-3 py-2 font-pixel text-lg transition-colors ${
                  isActive(href)
                    ? "bg-pink text-ink"
                    : "text-ink-soft hover:bg-pink/30 hover:text-ink"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-1">
            {birthday && (
              <Link
                href="/birthday"
                aria-current={isActive("/birthday") ? "page" : undefined}
                className="flex items-center gap-2 bg-pink px-3 py-2 font-pixel text-base text-ink"
              >
                <PixelIcon name="gift" size={2} />
                Gifts
              </Link>
            )}
            <button
              onClick={logout}
              className="cursor-pointer px-3 py-2 font-pixel text-base text-ink-soft transition-colors hover:bg-pink/30 hover:text-ink"
            >
              Log out
            </button>
          </div>
        </div>
      </nav>

      {/* Phone tab bar */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-50 border-t-4 border-line bg-paper pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <div className="mx-auto grid h-[60px] max-w-md grid-cols-5">
          {LINKS.map(({ href, short, icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center justify-center gap-1.5 font-pixel text-[13px] leading-none transition-colors ${
                  active ? "bg-pink text-ink" : "text-ink-soft"
                }`}
              >
                <PixelIcon name={icon} size={2} />
                {short}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
