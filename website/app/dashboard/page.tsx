"use client";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";

interface WhatsAppSession {
  sessionKey?: string;
  sessionId?: string;
  updatedAt?: number;
  abortedLastRun?: boolean;
  chatType?: string;
  lastChannel?: string;
  origin?: { label?: string; from?: string; to?: string };
  deliveryContext?: { channel?: string; to?: string };
  compactionCount?: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  model?: string;
}

function formatRelativeTime(timestamp: number | undefined | null): string {
  if (timestamp == null || timestamp === 0) return "never";
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 0) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatTokens(count: number | undefined | null): string {
  if (count == null) return "0";
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState<WhatsAppSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [verifyStep, setVerifyStep] = useState<"phone" | "code">("phone");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyFeedback, setVerifyFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const whatsappPhone = (user?.unsafeMetadata as Record<string, string> | undefined)?.whatsappPhone || "";

  const fetchSession = useCallback((isRefresh = false) => {
    if (!whatsappPhone) {
      setSession(null);
      setSessionLoading(false);
      return;
    }
    if (isRefresh) setRefreshing(true);
    else setSessionLoading(true);

    fetch(`/api/sessions?phone=${encodeURIComponent(whatsappPhone)}`)
      .then((res) => res.json())
      .then((data) => { if (!data.error) setSession(data); else setSession(null); })
      .catch(() => { setSession(null); })
      .finally(() => { setSessionLoading(false); setRefreshing(false); });
  }, [whatsappPhone]);

  useEffect(() => { fetchSession(); }, [fetchSession]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isLoaded) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </main>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleSendCode = async () => {
    if (!phoneNumber.trim()) return;
    setVerifyLoading(true);
    setVerifyFeedback(null);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", phone: phoneNumber }),
      });
      const data = await res.json();
      if (res.ok && data.sent) {
        setVerifyStep("code");
        setVerifyFeedback({ type: "success", text: "Code sent! Check your WhatsApp." });
      } else {
        setVerifyFeedback({ type: "error", text: data.error || "Failed to send code" });
      }
    } catch {
      setVerifyFeedback({ type: "error", text: "Network error. Please try again." });
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verifyCode.trim()) return;
    setVerifyLoading(true);
    setVerifyFeedback(null);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check", phone: phoneNumber, code: verifyCode.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.verified) {
        // Register the user in OpenClaw so they can message back
        try {
          await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: phoneNumber }),
          });
        } catch {
          // Registration is best-effort; verification already succeeded
        }
        setVerifyFeedback({ type: "success", text: "Verified! Your WhatsApp is connected." });
        await user.reload();
      } else {
        setVerifyFeedback({ type: "error", text: data.error || "Invalid or expired code" });
      }
    } catch {
      setVerifyFeedback({ type: "error", text: "Network error. Please try again." });
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <main className="min-h-screen pt-20 pb-12 px-4 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
              <p className="text-sm text-slate-400 mt-1">
                Welcome back, {user.firstName || user.emailAddresses[0]?.emailAddress}
              </p>
            </div>
            <button
              onClick={() => fetchSession(true)}
              disabled={refreshing || sessionLoading}
              title="Refresh session data"
              className="ml-1 mt-0.5 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          
          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="relative w-9 h-9 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center ring-2 ring-slate-700 hover:ring-slate-600 transition-all cursor-pointer"
            >
              {user.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt={user.fullName || "User"}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="text-sm font-medium text-white">
                  {user.firstName?.[0] || user.emailAddresses[0]?.emailAddress[0]?.toUpperCase()}
                </span>
              )}
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800/50 rounded-xl shadow-xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-slate-800/50">
                  <p className="text-sm font-medium text-white truncate">{user.fullName || "User"}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {user.emailAddresses[0]?.emailAddress}
                  </p>
                </div>
                
                <div className="p-1.5">
                  <Link
                    href="/account"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Account settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {sessionLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : whatsappPhone && !session ? (
          <div className="space-y-8">
            <div className="text-center max-w-xl mx-auto">
              <h2 className="text-3xl font-bold text-white tracking-tight">You&apos;re connected!</h2>
              <p className="text-sm text-slate-400 mt-2">
                Your WhatsApp number <span className="text-white font-mono">{whatsappPhone}</span> is verified. Send your first message on WhatsApp to start journaling, then refresh to see your session here.
              </p>
            </div>

            <div className="max-w-md mx-auto">
              <div className="bg-slate-900/50 border border-emerald-500/40 rounded-xl p-6 shadow-[0_0_25px_rgba(16,185,129,0.08)] text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                  <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">WhatsApp verified</p>
                  <p className="text-xs text-slate-500 mt-1">Send a message on WhatsApp to start your first session</p>
                </div>
                <button
                  onClick={() => fetchSession(true)}
                  disabled={refreshing}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {refreshing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Checking...
                    </span>
                  ) : "Check for sessions"}
                </button>
              </div>
            </div>
          </div>
        ) : !session ? (
          <div className="space-y-8">
            <div className="text-center max-w-xl mx-auto">
              <h2 className="text-3xl font-bold text-white tracking-tight">Connect your WhatsApp</h2>
              <p className="text-sm text-slate-400 mt-2">
                Enter your phone number to receive a verification code on WhatsApp and link your dashboard.
              </p>
            </div>

            <div className="max-w-md mx-auto">
              <div className="bg-slate-900/50 border border-emerald-500/40 rounded-xl p-6 shadow-[0_0_25px_rgba(16,185,129,0.08)]">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">WhatsApp verification</h3>
                    <p className="text-xs text-slate-500">
                      {verifyStep === "phone" ? "Step 1 of 2 — enter your number" : "Step 2 of 2 — enter the code"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {verifyStep === "phone" ? (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Phone number</label>
                        <div className="flex gap-2">
                          <div className="flex items-center rounded-lg bg-slate-950/50 border border-slate-700/50 px-3 text-sm text-slate-400 flex-shrink-0">
                            +
                          </div>
                          <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => {
                              setPhoneNumber(e.target.value.replace(/[^0-9]/g, ""));
                              setVerifyFeedback(null);
                            }}
                            onKeyDown={(e) => { if (e.key === "Enter" && phoneNumber.trim()) handleSendCode(); }}
                            className="w-full rounded-lg bg-slate-950/50 border border-slate-700/50 text-white text-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder-slate-600"
                            placeholder="1 555 123 4567"
                            autoFocus
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-1.5">Include your country code (e.g. 1 for US, 44 for UK)</p>
                      </div>

                      <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/15 p-3">
                        <div className="flex items-start gap-2.5">
                          <svg className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <p className="text-xs text-slate-400">
                            We&apos;ll send a <span className="text-emerald-400">6-digit code</span> to verify you own this number. The code expires in 5 minutes.
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Verification code</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={verifyCode}
                        onChange={(e) => {
                          setVerifyCode(e.target.value.replace(/[^0-9]/g, ""));
                          setVerifyFeedback(null);
                        }}
                        onKeyDown={(e) => { if (e.key === "Enter" && verifyCode.length === 6) handleVerifyCode(); }}
                        className="w-full rounded-lg bg-slate-950/50 border border-slate-700/50 text-white text-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder-slate-600 font-mono text-center text-lg tracking-[0.5em]"
                        placeholder="000000"
                        autoFocus
                      />
                      <p className="text-xs text-slate-500 mt-1.5">
                        Sent to +{phoneNumber}.{" "}
                        <button
                          onClick={() => { setVerifyStep("phone"); setVerifyCode(""); setVerifyFeedback(null); }}
                          className="text-emerald-400 hover:underline cursor-pointer"
                        >
                          Change number
                        </button>
                      </p>
                    </div>
                  )}

                  {verifyFeedback && (
                    <div className={`px-3 py-2 rounded-lg text-xs border ${
                      verifyFeedback.type === "success"
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}>
                      {verifyFeedback.text}
                    </div>
                  )}

                  <button
                    onClick={verifyStep === "phone" ? handleSendCode : handleVerifyCode}
                    disabled={verifyStep === "phone" ? !phoneNumber.trim() || verifyLoading : verifyCode.length !== 6 || verifyLoading}
                    className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {verifyLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {verifyStep === "phone" ? "Sending..." : "Verifying..."}
                      </span>
                    ) : verifyStep === "phone" ? (
                      "Send verification code"
                    ) : (
                      "Verify and connect"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
        <>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Active Sessions</p>
                <p className="text-2xl font-semibold text-white mt-1">1</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">WhatsApp connected</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Total Tokens</p>
                <p className="text-2xl font-semibold text-white mt-1">{formatTokens(session?.totalTokens)}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-slate-500">{formatTokens(session?.inputTokens)} in</span>
              <span className="text-xs text-slate-600">/</span>
              <span className="text-xs text-slate-500">{formatTokens(session?.outputTokens)} out</span>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Model</p>
                <p className="text-2xl font-semibold text-white mt-1 text-lg">{session?.model || "N/A"}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">AI provider</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Status</p>
                <p className="text-2xl font-semibold mt-1">
                  {session?.abortedLastRun ? (
                    <span className="text-red-400">Error</span>
                  ) : (
                    <span className="text-green-400">Active</span>
                  )}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${session?.abortedLastRun ? "bg-red-500/10" : "bg-green-500/10"}`}>
                {session?.abortedLastRun ? (
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Last active {formatRelativeTime(session?.updatedAt)}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* WhatsApp Session Detail */}
          <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800/50 rounded-xl">
            <div className="px-5 py-4 border-b border-slate-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <h2 className="text-sm font-medium text-white">WhatsApp Session</h2>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${session?.abortedLastRun ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"}`}>
                {session?.abortedLastRun ? "Error" : "Active"}
              </span>
            </div>
            <div className="p-5 space-y-4">
              {/* User & Channel */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-950/30 border border-slate-800/30">
                <div className="w-11 h-11 rounded-full bg-[#25D366]/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{session?.origin?.label || "Unknown"}</p>
                  <p className="text-xs text-slate-500 mt-0.5">WhatsApp Direct Message</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-slate-400">{formatRelativeTime(session?.updatedAt)}</p>
                  <p className="text-xs text-slate-600 mt-0.5">last active</p>
                </div>
              </div>

              {/* Session Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-950/30 border border-slate-800/30">
                  <p className="text-xs text-slate-500 mb-1">Channel</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#25D366]"></span>
                    <p className="text-xs text-slate-300 capitalize">{session?.lastChannel || "N/A"}</p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/30 border border-slate-800/30">
                  <p className="text-xs text-slate-500 mb-1">Chat Type</p>
                  <p className="text-xs text-slate-300 capitalize">{session?.chatType || "N/A"}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/30 border border-slate-800/30">
                  <p className="text-xs text-slate-500 mb-1">Compactions</p>
                  <p className="text-xs text-slate-300">{session?.compactionCount ?? 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/30 border border-slate-800/30">
                  <p className="text-xs text-slate-500 mb-1">Model</p>
                  <p className="text-xs text-slate-300">{session?.model || "N/A"}</p>
                </div>
              </div>

              {/* Token Usage Bar */}
              <div className="p-4 rounded-lg bg-slate-950/30 border border-slate-800/30">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-slate-400">Token Usage</p>
                  <p className="text-xs text-slate-500">{formatTokens(session?.totalTokens)} total</p>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800/50 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500" style={{ width: `${Math.min(((session?.totalTokens ?? 0) / 128000) * 100, 100)}%` }} />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="text-xs text-slate-500">Input: {formatTokens(session?.inputTokens)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span className="text-xs text-slate-500">Output: {formatTokens(session?.outputTokens)}</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-600">of 128k context</span>
                </div>
              </div>

              {/* Origin Details */}
              <div className="p-4 rounded-lg bg-slate-950/30 border border-slate-800/30">
                <p className="text-xs font-medium text-slate-400 mb-3">Delivery Context</p>
                <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
                  <div>
                    <p className="text-xs text-slate-600">From</p>
                    <p className="text-xs text-slate-300 font-mono">{session?.origin?.from || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">To</p>
                    <p className="text-xs text-slate-300 font-mono">{session?.deliveryContext?.to || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Channel</p>
                    <p className="text-xs text-slate-300 capitalize">{session?.deliveryContext?.channel || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Model</p>
                    <p className="text-xs text-slate-300">{session?.model || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl">
            <div className="px-5 py-4 border-b border-slate-800/50">
              <h2 className="text-sm font-medium text-white">Quick Actions</h2>
            </div>
            <div className="p-3">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all cursor-pointer text-left">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-slate-300">New Journal Entry</p>
                  <p className="text-xs text-slate-500">Record a thought or reflection</p>
                </div>
              </button>

              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all cursor-pointer text-left">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-slate-300">View Timeline</p>
                  <p className="text-xs text-slate-500">See your D/W/M/Q/Y highlights</p>
                </div>
              </button>

              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all cursor-pointer text-left">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-slate-300">Insights</p>
                  <p className="text-xs text-slate-500">Explore patterns and progress</p>
                </div>
              </button>

              <a href="https://docs.loglife.co/" target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all text-left">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-slate-300">Documentation</p>
                  <p className="text-xs text-slate-500">Learn how to use LogLife</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-6 bg-slate-900/50 border border-slate-800/50 rounded-xl">
          <div className="px-5 py-4 border-b border-slate-800/50">
            <h2 className="text-sm font-medium text-white">Recent Activity</h2>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#25D366]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3.5 h-3.5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-300">WhatsApp session active with <span className="text-white font-mono text-xs">{session?.origin?.label || "Unknown"}</span></p>
                <p className="text-xs text-slate-500 mt-0.5">{formatRelativeTime(session?.updatedAt)} &middot; {formatTokens(session?.totalTokens)} tokens used &middot; {session?.model || "N/A"}</p>
              </div>
              <span className="flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-400">
                Active
              </span>
            </div>

            <div className="h-px bg-slate-800/30"></div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-300">WhatsApp number <span className="text-white font-mono text-xs">{whatsappPhone}</span> verified</p>
                <p className="text-xs text-slate-500 mt-0.5">Account connected via phone verification</p>
              </div>
              <span className="flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium bg-slate-800/50 text-slate-400">
                Verified
              </span>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </main>
  );
}
