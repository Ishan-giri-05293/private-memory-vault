"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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
    } catch {
      setError("Hmm… that doesn’t look right 💭");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center px-5 pb-40">
      <div className="w-full max-w-sm">
        <h1 className="page-title animate-pop mb-8 text-center">
          Welcome
          <br />
          home, Aru
        </h1>
        <div
          className="pixel-card animate-pop p-7"
          style={{ "--delay": "0.1s" } as React.CSSProperties}
        >
          <p className="mb-6 text-center text-ink-soft">
            Your little corner of memories is waiting.
          </p>

          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="field-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field"
              />
            </div>

            <div>
              <label htmlFor="password" className="field-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field"
              />
            </div>

            {error && (
              <p role="alert" className="text-center text-sm font-semibold text-destructive">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="pixel-btn w-[calc(100%-6px)]">
              {loading ? "Opening…" : "Enter"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-ink-soft">
            Only you can see what’s inside.
          </p>
        </div>
      </div>
    </main>
  );
}
