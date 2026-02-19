"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingReset, setPendingReset] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);
    setError("");

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      setPendingReset(true);
      setSuccessMessage(`We sent a reset code to ${email}`);
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] };
      setError(clerkError.errors?.[0]?.message || "Failed to send reset code. Please check your email and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] };
      setError(clerkError.errors?.[0]?.message || "Failed to reset password. Please check the code and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Enter code and new password
  if (pendingReset) {
    return (
      <main className="min-h-screen flex items-center justify-center pt-24 pb-12 px-6 lg:px-8">
        <div className="w-full max-w-lg space-y-8 animate-slide-up">
          <div className="text-center">
            <Link href="/" className="inline-block relative w-14 h-14 mb-6 hover:opacity-80 transition-opacity">
              <Image src="/icon-small.svg" alt="LogLife" fill className="object-contain" />
            </Link>
            <h2 className="text-4xl font-bold tracking-tight text-white">Reset your password</h2>
            <p className="mt-3 text-base text-slate-400">{successMessage}</p>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-10 shadow-2xl">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleResetPassword}>
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-slate-300 mb-2">
                  Reset code
                </label>
                <input
                  id="code"
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full rounded-xl bg-slate-950/50 border border-slate-700 text-white px-5 py-4 text-base text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder-slate-500"
                  placeholder="000000"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl bg-slate-950/50 border border-slate-700 text-white px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder-slate-500"
                  placeholder="••••••••"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Must be at least 8 characters
                </p>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm new password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl bg-slate-950/50 border border-slate-700 text-white px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder-slate-500"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-4 px-4 rounded-xl text-base font-semibold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-slate-900 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Resetting password..." : "Reset Password"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setPendingReset(false);
                  setCode("");
                  setPassword("");
                  setConfirmPassword("");
                  setError("");
                }}
                className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
              >
                Didn&apos;t receive the code? Try again
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Step 1: Enter email
  return (
    <main className="min-h-screen flex items-center justify-center pt-24 pb-12 px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-8 animate-slide-up">
        <div className="text-center">
          <Link href="/" className="inline-block relative w-14 h-14 mb-6 hover:opacity-80 transition-opacity">
            <Image src="/icon-small.svg" alt="LogLife" fill className="object-contain" />
          </Link>
          <h2 className="text-4xl font-bold tracking-tight text-white">Forgot password?</h2>
          <p className="mt-3 text-base text-slate-400">
            Enter your email and we&apos;ll send you a reset code
          </p>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-10 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleRequestReset}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-slate-950/50 border border-slate-700 text-white px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder-slate-500"
                placeholder="name@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-4 px-4 rounded-xl text-base font-semibold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-slate-900 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending reset code..." : "Send Reset Code"}
            </button>
          </form>
        </div>

        <p className="text-center text-base text-slate-400">
          Remember your password?{" "}
          <Link href="/login" className="font-semibold text-emerald-400 hover:text-emerald-300 hover:underline transition-all">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
