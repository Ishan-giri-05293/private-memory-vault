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
      setError("Please enter your email and password.");
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
      setError("Wrong email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm bg-white p-6 rounded-2xl border border-border shadow-sm">
        {/* Title */}
        <div className="text-center space-y-3 mb-8">
          <h1 className="text-2xl font-light text-foreground">Welcome Aru💕</h1>
          <p className="text-sm font-light text-muted-foreground">
            Only you can access this space.
          </p>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-border bg-white outline-none focus:ring-2 focus:ring-neutral-200"
          />

          <input
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-border bg-white outline-none focus:ring-2 focus:ring-neutral-200"
          />

          {error && (
            <p className="text-sm text-red-600 font-light text-center">
              {error}
            </p>
          )}

          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-6 rounded-lg bg-black text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Opening…" : "Enter"}
          </Button>
        </div>

        {/* Footer note */}
        <p className="text-xs font-light text-muted-foreground text-center mt-6">
          This is private.
        </p>
      </div>
    </div>
  );
}
