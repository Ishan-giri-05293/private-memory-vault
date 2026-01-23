"use client";

import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const logout = async () => {
  await signOut(auth);
  document.cookie = "firebase-auth=; path=/; max-age=0";
  window.location.href = "/login";
};

export default function PromisePage() {
  return (
    <div className="min-h-screen">
      {/* Header
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/40">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          <Link href="/">
            <h1 className="text-lg font-light tracking-wide text-foreground">
              A Space for Arunima
            </h1>
          </Link>
          <nav className="flex items-center gap-8">
            <Link
              href="/vault"
              className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors"
            >
              Memories
            </Link>
            <Link
              href="/goals"
              className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors"
            >
              Goals
            </Link>
            <Link
              href="/promise"
              className="text-sm font-light text-foreground transition-colors"
            >
              Promise
            </Link>
            <button
              onClick={logout}
              className="text-sm text-neutral-600 hover:text-black"
            >
              Log out
            </button>
          </nav>
        </div>
      </header> */}

      {/* Main Content */}
      <main className="container mx-auto px-6 pt-20 pb-20 max-w-3xl">
        <div className="space-y-16">
          {/* Title */}
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-light text-foreground">
              Promise
            </h2>
          </div>

          {/* Content Sections */}
          <div className="space-y-12 text-base md:text-lg font-light text-muted-foreground leading-relaxed">
            <section className="space-y-4">
              <h3 className="text-xl font-light text-foreground">
                This is yours
              </h3>
              <p>
                Your memories, your words, your milestones. Everything you add
                here belongs to you and only you. We don't share your data. We
                don't sell your information. We don't show you ads based on your
                most intimate moments.
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-light text-foreground">
                Built for the long term
              </h3>
              <p>
                This space is designed to last decades. We're not chasing trends
                or building for quick exits. We're here to help you preserve
                what matters, for as long as it matters to you.
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-light text-foreground">
                Privacy by design
              </h3>
              <p>
                No social features. No follower counts. No public profiles. Just
                a quiet, private place for you to reflect, remember, and grow.
                Some things are too important to be shared with the world.
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-light text-foreground">
                Your data, your control
              </h3>
              <p>
                You can export everything at any time. You can delete your
                account whenever you choose. This is your space, and you're
                always in control of what happens to it.
              </p>
            </section>

            <section className="pt-8 border-t border-border/40 space-y-4">
              <p className="text-foreground italic">
                Some moments deserve a place that honors their weight. This is
                that place.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
