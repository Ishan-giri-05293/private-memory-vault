"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Just fill both… you know the drill 💌");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const token = await userCredential.user.getIdToken();
      document.cookie = `firebase-auth=${token}; path=/; max-age=86400; samesite=lax`;

      router.push("/");
    } catch (err: any) {
      setError("Hmm… that doesn’t look right 💭");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-5 relative overflow-hidden">

      {/* Soft glow background */}
      <div className="absolute -top-32 -left-32 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-72 h-72 bg-accent/20 rounded-full blur-3xl" />

      <div className="w-full max-w-sm bg-card/90 backdrop-blur p-7 rounded-3xl border border-border shadow-lg relative z-10">

        {/* Title */}
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-2xl font-light text-foreground tracking-wide">
            Welcome Aru 💕
          </h1>
          <p className="text-sm font-light text-muted-foreground">
            Your little corner of memories is waiting.
          </p>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-border bg-card outline-none focus:ring-2 focus:ring-primary/40 transition"
          />

          <input
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-border bg-card outline-none focus:ring-2 focus:ring-primary/40 transition"
          />

          {error && (
            <p className="text-sm text-destructive font-light text-center">
              {error}
            </p>
          )}

          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-6 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50 text-base"
          >
            {loading ? "Opening your space…" : "Enter Your Space"}
          </Button>
        </div>

        {/* Footer */}
        <p className="text-xs font-light text-muted-foreground text-center mt-6">
          Only you can see what’s inside 🤍
        </p>
      </div>
    </div>
  );
}
