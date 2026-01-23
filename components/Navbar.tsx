"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

export default function Navbar() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsub();
  }, []);

  // Hide navbar on login page OR when not logged in
  if (!isLoggedIn || pathname === "/login") return null;

  const logout = async () => {
    await signOut(auth);
    document.cookie = "firebase-auth=; path=/; max-age=0";
    window.location.href = "/login";
  };

  const linkClass = (href: string) =>
  `px-3 py-2 rounded-md text-sm transition outline-none focus:outline-none focus:ring-0 ${
    pathname === href
      ? "bg-black text-white"
      : "text-neutral-600 hover:text-black hover:bg-neutral-100"
  }`;

  

  return (
    <nav className="w-full sticky top-0 z-50 bg-white/90 backdrop-blur border-b">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="font-semibold text-base text-black">
          A Space for Arunima
        </Link>

        {/* Links */}
        <div className="flex items-center gap-1">
          <Link href="/vault" className={linkClass("/vault")}>
            Vault
          </Link>
          <Link href="/goals" className={linkClass("/goals")}>
            Goals
          </Link>
          <Link href="/promise" className={linkClass("/promise")}>
            Promise
          </Link>

          {/* Logout */}
          <button
            onClick={logout}
            className="ml-2 px-3 py-2 rounded-md text-sm text-neutral-600 hover:text-black hover:bg-neutral-100 outline-none focus:outline-none focus:ring-0"
          >
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
