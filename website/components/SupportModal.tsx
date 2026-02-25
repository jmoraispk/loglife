"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

type SupportModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type SupportFormState = {
  type: string;
  subject: string;
  email: string;
  message: string;
  attachmentName: string;
};

const INITIAL_FORM_STATE: SupportFormState = {
  type: "Feedback",
  subject: "",
  email: "",
  message: "",
  attachmentName: "",
};

export default function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const [formState, setFormState] = useState<SupportFormState>(INITIAL_FORM_STATE);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const resetState = () => {
    setFormState(INITIAL_FORM_STATE);
    setIsSending(false);
    setIsSent(false);
    setError(null);
  };

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusFirstElement = () => {
      const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(focusableSelector);
      focusableElements?.[0]?.focus();
    };

    const keydownHandler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
        return;
      }

      if (event.key !== "Tab" || !modalRef.current) return;

      const focusableElements = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((element) => !element.hasAttribute("disabled"));

      if (!focusableElements.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    const focusTimeout = setTimeout(focusFirstElement, 0);
    document.addEventListener("keydown", keydownHandler);

    return () => {
      clearTimeout(focusTimeout);
      document.removeEventListener("keydown", keydownHandler);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, handleClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSending) return;

    setIsSending(true);
    setError(null);

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formState.type,
          subject: formState.subject,
          email: formState.email,
          message: formState.message,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      setIsSent(true);
    } catch {
      setError("Network error — please try again");
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-sm"
      onClick={handleClose}
      aria-hidden="true"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-modal-title"
        className="h-full w-full overflow-y-auto bg-slate-900 text-slate-100 shadow-[0_25px_60px_-12px_rgba(0,0,0,0.5)] sm:h-auto sm:max-h-[90vh] sm:max-w-xl sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative border-b border-slate-700/60 bg-gradient-to-r from-slate-900 via-slate-800/40 to-slate-900 px-5 py-5">
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 id="support-modal-title" className="text-base font-bold tracking-tight text-white">
                Help &amp; Feedback
              </h2>
              <p className="mt-0.5 text-xs font-medium tracking-wide text-slate-500 uppercase">
                We&apos;re here to help
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-700/60 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {!isSent ? (
          <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="font-medium text-slate-400">Type</span>
                <select
                  className="w-full cursor-pointer rounded-xl bg-white/[0.06] px-3.5 py-2.5 text-sm text-white transition focus:bg-white/[0.09] focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                  value={formState.type}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      type: event.target.value,
                    }))
                  }
                >
                  <option value="Feedback" className="bg-slate-900 text-white">Feedback</option>
                  <option value="Bug" className="bg-slate-900 text-white">Bug</option>
                  <option value="Question" className="bg-slate-900 text-white">Question</option>
                </select>
              </label>

              <label className="space-y-2 text-sm">
                <span className="font-medium text-slate-400">Email</span>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={formState.email}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl bg-white/[0.06] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 transition focus:bg-white/[0.09] focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                />
              </label>
            </div>

            <label className="block space-y-2 text-sm">
              <span className="font-medium text-slate-400">Subject</span>
              <input
                type="text"
                placeholder="Brief summary"
                value={formState.subject}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    subject: event.target.value,
                  }))
                }
                className="w-full rounded-xl bg-white/[0.06] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 transition focus:bg-white/[0.09] focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
              />
            </label>

            <label className="block space-y-2 text-sm">
              <span className="font-medium text-slate-400">Message</span>
              <textarea
                rows={4}
                placeholder="Describe your issue or feedback…"
                value={formState.message}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    message: event.target.value,
                  }))
                }
                className="w-full rounded-xl bg-white/[0.06] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 transition focus:bg-white/[0.09] focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
              />
            </label>

            <label className="block space-y-2 text-sm">
              <span className="font-medium text-slate-400">Attachment</span>
              <input
                type="text"
                value={formState.attachmentName}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    attachmentName: event.target.value,
                  }))
                }
                className="w-full rounded-xl bg-white/[0.06] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 transition focus:bg-white/[0.09] focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
              />
            </label>

            <div className="space-y-3 pt-2">
              {error && (
                <p className="text-right text-sm text-red-400">{error}</p>
              )}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="cursor-pointer rounded-xl px-5 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="cursor-pointer inline-flex min-w-28 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                >
                  {isSending ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="px-5 py-8">
            <div className="mx-auto max-w-md rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
              <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center">
                <span className="absolute h-14 w-14 animate-ping rounded-full bg-emerald-400/30" />
                <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-7 w-7"
                    aria-hidden="true"
                  >
                    <path d="m5 12 5 5L20 7" />
                  </svg>
                </span>
              </div>
              <h3 className="text-lg font-semibold text-emerald-200">
                Thanks — your message has been sent
              </h3>
              <p className="mt-2 text-sm text-emerald-100/80">
                We&apos;ll get back to you as soon as possible.
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-5 cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
