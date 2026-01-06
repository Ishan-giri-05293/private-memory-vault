"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Header() {
  const logout = async () => {
    await signOut(auth);
    document.cookie = "firebase-auth=; path=/; max-age=0";
    window.location.href = "/login";
  };

  return (
    <header className="w-full flex justify-end px-4 py-3 border-b bg-white">
      <button
        onClick={logout}
        className="text-sm text-neutral-600 hover:text-black"
      >
        Log out
      </button>
    </header>
  );
}
