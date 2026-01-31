"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-6 pt-20 pb-20">
        <div className="max-w-3xl mx-auto text-center space-y-12">
          <div className="space-y-6">
            <p className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight">
              A quiet place to hold <span className="italic">your moments</span>
            </p>

            <p className="text-base md:text-lg font-light pink-muted leading-relaxed max-w-2xl mx-auto">
              Store the memories that matter.
              <br />
              Keep the promises you make.
              <br />
              <span className="font-normal text-black/80">
                Build a vault of your life.
              </span>
            </p>
          </div>

          {/* Buttons (phone-first) */}
          <div className="pt-4 space-y-4 max-w-sm mx-auto">
            <Button
              asChild
              size="lg"
              className="w-full pink-button text-base px-10 py-7"
            >
              <Link href="/vault">Enter Your Space</Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full border border-[#f3d6dc] bg-white/60 hover:bg-white text-base px-10 py-7 rounded-lg"
            >
              <Link href="/goals?new=1">Add a Goal</Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[#f3d6dc]">
        <div className="container mx-auto text-center">
          <p className="text-sm font-light pink-muted">
            This will grow with you.
          </p>
        </div>
      </footer>
    </div>
  );
}
