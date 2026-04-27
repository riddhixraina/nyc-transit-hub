import { useState, type FormEvent } from "react";
import { useAuth } from "../lib/auth";
import { ErrorState } from "../components/common/ErrorState";
import { SectionTitle } from "../components/common/SectionTitle";

export function LoginPage() {
  const { signIn, signUp, signInWithGoogle, user, isConfigured, isLoading } =
    useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    }
  }

  async function onGoogle() {
    setError("");
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
    }
  }

  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow="Auth shell"
        title="Firebase login"
        description="The frontend includes the planned auth layer, but it stays optional until Firebase environment variables are configured."
      />

      <section className="mx-auto max-w-xl rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-panel">
        {user ? (
          <div>
            <p className="text-sm text-slate">Signed in as</p>
            <p className="mt-2 font-display text-3xl text-ink">
              {user.email || user.uid}
            </p>
          </div>
        ) : (
          <>
            {!isConfigured ? (
              <div className="rounded-3xl bg-sand/60 p-4 text-sm text-ink">
                Firebase is not configured yet. Add `VITE_FIREBASE_*` variables to
                enable live authentication.
              </div>
            ) : null}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${mode === "signin" ? "bg-ink text-white" : "bg-mist text-ink"}`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${mode === "signup" ? "bg-ink text-white" : "bg-mist text-ink"}`}
              >
                Create account
              </button>
            </div>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-ink">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-ink/10 px-4 py-3 text-sm outline-none focus:border-tide"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-ink">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-ink/10 px-4 py-3 text-sm outline-none focus:border-tide"
                  required
                />
              </label>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-full bg-tide px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {mode === "signin" ? "Sign in with email" : "Create account"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => void onGoogle()}
              className="mt-4 w-full rounded-full border border-ink/10 bg-white px-5 py-3 text-sm font-semibold text-ink"
            >
              Continue with Google
            </button>
          </>
        )}
      </section>

      {error ? <ErrorState message={error} /> : null}
    </div>
  );
}
