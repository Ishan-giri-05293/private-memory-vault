"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    // close menu when route changes
    setOpen(false);
  }, [pathname]);

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!open) return;
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  if (!isLoggedIn || pathname === "/login") return null;

  const logout = async () => {
    await signOut(auth);
    document.cookie = "firebase-auth=; path=/; max-age=0";
    window.location.href = "/login";
  };

  const linkClass = (href: string) =>
    `px-3 py-2 rounded-md text-sm transition whitespace-nowrap outline-none focus:outline-none focus:ring-0 ${
      pathname === href
        ? "bg-black text-white"
        : "text-neutral-600 hover:text-black hover:bg-neutral-100"
    }`;

  return (
    <nav className="w-full sticky top-0 z-50 bg-white/90 backdrop-blur border-b">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="font-semibold text-base text-black">
          A Space for You
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          <Link href="/vault" className={linkClass("/vault")}>
            Vault
          </Link>
          <Link href="/goals" className={linkClass("/goals")}>
            Goals
          </Link>
          <Link href="/promise" className={linkClass("/promise")}>
            Promise
          </Link>

          <button
            onClick={logout}
            className="ml-2 px-3 py-2 rounded-md text-sm text-neutral-600 hover:text-black hover:bg-neutral-100 outline-none focus:outline-none focus:ring-0"
          >
            Log out
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-neutral-100 active:scale-[0.98] transition"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span
            className={`inline-flex transition-transform duration-200 ${
              open ? "rotate-90" : "rotate-0"
            }`}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </span>
        </button>
      </div>

      {/* Mobile dropdown (animated) */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-200 ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div
          ref={menuRef}
          className={`px-4 pb-4 transition-all duration-200 ${
            open ? "translate-y-0" : "-translate-y-2"
          }`}
        >
          <div className="mt-2 rounded-2xl border border-border bg-white shadow-sm p-2">
            <Link
              href="/vault"
              className="block w-full px-3 py-3 rounded-xl hover:bg-neutral-100 transition"
            >
              Vault
            </Link>
            <Link
              href="/goals"
              className="block w-full px-3 py-3 rounded-xl hover:bg-neutral-100 transition"
            >
              Goals
            </Link>
            <Link
              href="/promise"
              className="block w-full px-3 py-3 rounded-xl hover:bg-neutral-100 transition"
            >
              Promise
            </Link>

            <div className="h-px bg-border my-1" />

            <button
              onClick={logout}
              className="w-full text-left px-3 py-3 rounded-xl text-neutral-700 hover:bg-neutral-100 transition"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
