"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

// Sample data - in a real app this would come from a database
const memories = [
  {
    id: 1,
    title: "First steps in the garden",
    date: "March 15, 2024",
  },
  {
    id: 2,
    title: "Summer evening on the porch",
    date: "July 22, 2023",
  },
  {
    id: 3,
    title: "Morning coffee ritual begins",
    date: "January 8, 2023",
  },
];

const logout = async () => {
  await signOut(auth);
  document.cookie = "firebase-auth=; path=/; max-age=0";
  window.location.href = "/login";
};

export default function VaultPage() {
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
              className="text-sm font-light text-foreground transition-colors"
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
              className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors"
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
      <main className="container mx-auto px-6 pt-20 pb-20 max-w-5xl">
        <div className="space-y-12">
          {/* Title Section */}
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-light text-foreground">
              Your Memory Vault
            </h2>
            <p className="text-base font-light text-muted-foreground leading-relaxed max-w-2xl">
              Each moment preserved with care. A collection that grows with you.
            </p>
          </div>

          {/* Upload Button */}
          <div>
            <Button
              size="lg"
              variant="outline"
              className="border-border hover:bg-accent/50 text-foreground font-light text-sm px-8 py-5 gap-3 bg-transparent"
            >
              <Plus className="w-4 h-4" />
              Add a Memory
            </Button>
          </div>

          {/* Memories Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {memories.map((memory) => (
              <Card
                key={memory.id}
                className="group p-8 bg-card hover:bg-accent/30 border-border transition-all cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="aspect-[4/3] bg-muted/30 rounded-md" />
                  <div className="space-y-2">
                    <h3 className="text-base font-light text-foreground group-hover:text-foreground/80 transition-colors">
                      {memory.title}
                    </h3>
                    <p className="text-sm font-light text-muted-foreground">
                      {memory.date}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
