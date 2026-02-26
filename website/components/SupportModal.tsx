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
  attachment: File | null;
};

const INITIAL_FORM_STATE: SupportFormState = {
  type: "Feedback",
  subject: "",
  email: "",
  message: "",
  attachment: null,
};

const MAX_ATTACHMENT_SIZE_MB = 5;
const MAX_ATTACHMENT_BYTES = MAX_ATTACHMENT_SIZE_MB * 1024 * 1024;

const inputBase =
  "w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 transition-all duration-200 focus:border-emerald-500/50 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-emerald-500/50";

export default function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const [formState, setFormState] = useState<SupportFormState>(INITIAL_FORM_STATE);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  /** Ref updated synchronously in onChange so we never open the picker twice after selection */
  const hasAttachmentRef = useRef(false);

  const resetState = () => {
    setFormState(INITIAL_FORM_STATE);
    hasAttachmentRef.current = false;
    if (fileInputRef.current) fileInputRef.current.value = "";
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

  const openFilePicker = useCallback(() => {
    if (hasAttachmentRef.current) return;
    fileInputRef.current?.click();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSending) return;

    if (formState.attachment && formState.attachment.size > MAX_ATTACHMENT_BYTES) {
      setError(`Attachment must be under ${MAX_ATTACHMENT_SIZE_MB} MB`);
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("type", formState.type);
      formData.append("subject", formState.subject);
      formData.append("email", formState.email);
      formData.append("message", formState.message);
      if (formState.attachment) {
        formData.append("attachment", formState.attachment);
      }

      const res = await fetch("/api/support", {
        method: "POST",
        body: formData,
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
        className="h-full w-full overflow-y-auto bg-slate-900 text-slate-100 shadow-[0_25px_60px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.06),0_0_80px_-20px_rgba(34,197,94,0.15)] sm:h-auto sm:max-h-[90vh] sm:max-w-xl sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative border-b border-white/5 bg-gradient-to-r from-slate-900 via-slate-800/40 to-slate-900 px-6 py-6 sm:px-8 sm:py-6">
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
          <div className="flex items-center gap-4">
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
            <div className="flex-1 min-w-0">
              <h2 id="support-modal-title" className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                Help &amp; Feedback
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                We&apos;re here to help
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-all duration-200 hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
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
          <form onSubmit={handleSubmit} className="space-y-6 px-6 py-8 sm:px-8">
            {/* Row 1: Type + Email */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label htmlFor="support-type" className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Type</span>
                <select
                  id="support-type"
                  className={`${inputBase} cursor-pointer`}
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

              <label htmlFor="support-email" className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Email</span>
                <input
                  id="support-email"
                  type="email"
                  placeholder="you@example.com"
                  value={formState.email}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                  className={inputBase}
                />
              </label>
            </div>

            {/* Row 2: Subject */}
            <label htmlFor="support-subject" className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Subject</span>
              <input
                id="support-subject"
                type="text"
                placeholder="Brief summary"
                value={formState.subject}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    subject: event.target.value,
                  }))
                }
                className={inputBase}
              />
            </label>

            {/* Row 3: Message */}
            <label htmlFor="support-message" className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Message</span>
              <textarea
                id="support-message"
                placeholder="Describe your issue or feedback…"
                value={formState.message}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    message: event.target.value,
                  }))
                }
                className={`${inputBase} min-h-[140px] resize-y`}
                rows={5}
              />
            </label>

            {/* Row 4: Attachment */}
            <div className="space-y-2">
              <span className="block text-xs font-medium uppercase tracking-wider text-zinc-400">Attachment</span>
              <div
                role="button"
                tabIndex={0}
                onClick={() => !formState.attachment && openFilePicker()}
                onKeyDown={(e) => {
                  if (!formState.attachment && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    openFilePicker();
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    hasAttachmentRef.current = true;
                    setFormState((prev) => ({ ...prev, attachment: file }));
                    setError(null);
                  }
                }}
                className={`relative flex min-h-[120px] flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                  formState.attachment
                    ? "border-white/10 bg-white/[0.03]"
                    : isDragging
                      ? "border-emerald-500/50 bg-emerald-500/10"
                      : "border-white/15 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06] focus-within:border-emerald-500/40 focus-within:ring-2 focus-within:ring-emerald-500/30"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  name="attachment"
                  accept="image/*,.pdf,.txt,.log,.csv,.json"
                  className="absolute h-0 w-0 overflow-hidden opacity-0 [pointer-events:none]"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    hasAttachmentRef.current = !!file;
                    setFormState((prev) => ({ ...prev, attachment: file ?? null }));
                    setError(null);
                  }}
                  aria-label="Attachment file"
                />
                {formState.attachment ? (
                  <div className="flex flex-col items-center gap-2 px-4 py-3">
                    <span className="text-sm font-medium text-emerald-300">
                      {formState.attachment.name}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {(formState.attachment.size / 1024).toFixed(1)} KB
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          hasAttachmentRef.current = false;
                          setFormState((prev) => ({ ...prev, attachment: null }));
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all duration-200 hover:bg-white/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      >
                        Remove
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all duration-200 hover:bg-white/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      >
                        Change file
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <svg
                      className="h-9 w-9 text-zinc-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      />
                    </svg>
                    <span className="mt-2 text-sm text-zinc-400">
                      Drop a file here or click to browse
                    </span>
                    <span className="text-xs text-zinc-500">
                      Images, PDF, text, log — max {MAX_ATTACHMENT_SIZE_MB} MB
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {error && (
                <p className="text-right text-sm text-red-400" role="alert">{error}</p>
              )}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="cursor-pointer rounded-xl px-5 py-2.5 text-sm font-medium text-zinc-400 transition-all duration-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="cursor-pointer inline-flex min-w-28 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:scale-[1.02] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 disabled:hover:brightness-100 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                >
                  {isSending ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="px-6 py-8 sm:px-8">
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
