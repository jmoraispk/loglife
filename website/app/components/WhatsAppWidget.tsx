"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useWhatsAppWidget } from "../contexts/WhatsAppWidgetContext";

const PANEL_TRANSITION_MS = 200;

function IconWhatsApp() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471.148-.67.445-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconTelegram() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function IconWeChat() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.202.57.112 1.21-.242 1.676l-.39 1.478c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 9.25 9.25 0 0 0 3.077-.508c2.705-.988 4.437-3.418 4.437-6.127 0-2.356-1.872-4.393-4.273-4.487zm-2.41 3.376c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconChatFAB() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconQR() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

export default function WhatsAppWidget() {
  const { isOpen, toggleWidget, closeWidget, isVisible } = useWhatsAppWidget();
  const [isAnimating, setIsAnimating] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [isPanelClosing, setIsPanelClosing] = useState(false);
  const [isPanelEntered, setIsPanelEntered] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const number = "17155157761";
  const message = "help";
  const link = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

  useEffect(() => {
    if (!isOpen) return;
    const id = requestAnimationFrame(() => setIsAnimating(false));
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  // Enter: after panel mounts, trigger transition from opacity-0 to opacity-100
  useEffect(() => {
    if (!isChatPanelOpen || isPanelClosing) return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsPanelEntered(true));
    });
    return () => {
      cancelAnimationFrame(id);
      setIsPanelEntered(false);
    };
  }, [isChatPanelOpen, isPanelClosing]);

  // Close: run exit animation then unmount
  useEffect(() => {
    if (!isPanelClosing) return;
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      closeTimeoutRef.current = null;
      setIsChatPanelOpen(false);
      setIsPanelClosing(false);
      setIsPanelEntered(false);
      closeWidget();
    }, PANEL_TRANSITION_MS);
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, [isPanelClosing, closeWidget]);

  const handleToggle = () => {
    if (isOpen) {
      setIsAnimating(true);
      setTimeout(() => {
        closeWidget();
        setIsAnimating(false);
      }, 100);
    } else {
      toggleWidget();
    }
  };

  const openChatPanel = () => setIsChatPanelOpen(true);
  const closeChatPanel = () => setIsPanelClosing(true);

  const isPanelVisible = isChatPanelOpen || isPanelClosing;
  const panelTransitionClasses =
    isPanelClosing
      ? "opacity-0 translate-y-3 scale-95 pointer-events-none"
      : !isPanelEntered
        ? "opacity-0 translate-y-3 scale-95"
        : "opacity-100 translate-y-0 scale-100";

  if (!isVisible) return null;

  return (
    <>
      {isOpen && (
        <div 
          className={`fixed bottom-6 right-24 z-50 flex flex-col items-center rounded-3xl p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] backdrop-blur-xl max-w-sm transition-all ease-out bg-slate-900/60 border border-slate-700/50 ${
            isAnimating 
              ? 'opacity-0 translate-x-12 duration-200' 
              : 'opacity-100 translate-x-0 duration-300'
          }`}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-6 w-full">
            <div className="p-2.5 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl shadow-lg">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471.148-.67.445-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold transition-colors text-white">Start Logging</h3>
              <p className="text-sm transition-colors text-slate-400">Chat with LogLife on WhatsApp</p>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="relative mb-6 group">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
            <div className="relative p-6 rounded-2xl transition-colors bg-slate-700">
              <div className="relative w-64 h-64">
                <Image 
                  src="/qr_code.png" 
                  alt="Scan to chat on WhatsApp"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="flex items-center gap-2 mb-6 px-4 py-3 rounded-xl border transition-colors bg-brand-900/30 border-brand-800/50">
            <div className="text-brand-400">
              <IconQR />
            </div>
            <p className="text-sm font-medium transition-colors text-brand-300">
              Scan QR code to start chatting
            </p>
          </div>

          {/* Divider */}
          <div className="w-full flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-transparent transition-colors via-slate-600" />
            <span className="text-xs font-semibold uppercase tracking-wider transition-colors text-slate-500">or</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-transparent transition-colors via-slate-600" />
          </div>

          {/* Button */}
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="group w-full text-center rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-8 py-4 font-bold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-base flex items-center justify-center gap-3"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white" className="transition-transform group-hover:scale-110">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471.148-.67.445-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Open WhatsApp
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
        </div>
      )}

      {/* Single FAB: opens chat panel when closed; becomes close (cross) when panel open */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-3">
        {/* Chat panel: enter/exit transition */}
        {isPanelVisible && (
          <div
            className={`flex flex-col items-center gap-3 transition-all duration-200 ease-out ${panelTransitionClasses}`}
          >
            {/* Static: WeChat */}
            <button
              type="button"
              className="flex items-center justify-center rounded-full p-4 w-14 h-14 bg-gradient-to-br from-[#07C160] to-[#06AD56] text-white shadow-2xl border border-[#07C160]/80 cursor-pointer transition-transform duration-300 ease-out hover:scale-105"
              aria-label="WeChat"
              onClick={() => {}}
            >
              <IconWeChat />
            </button>
            {/* Static: Telegram */}
            <button
              type="button"
              className="flex items-center justify-center rounded-full p-4 w-14 h-14 bg-gradient-to-br from-[#0088cc] to-[#0077b5] text-white shadow-2xl border border-[#0088cc]/80 cursor-pointer transition-transform duration-300 ease-out hover:scale-105"
              aria-label="Telegram"
              onClick={() => {}}
            >
              <IconTelegram />
            </button>
            {/* WhatsApp: opens QR popup */}
            <button
              onClick={handleToggle}
              className={`flex items-center justify-center rounded-full p-4 w-14 h-14 transition-all duration-300 ease-out cursor-pointer ${
                isOpen
                  ? "bg-slate-800/90 backdrop-blur-sm text-slate-200 hover:bg-slate-700 hover:scale-105 shadow-lg border border-slate-700 rotate-90"
                  : "bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-2xl hover:shadow-brand-500/50 hover:scale-110 border border-brand-400 rotate-0"
              }`}
              aria-label={isOpen ? "Close WhatsApp popup" : "Open WhatsApp popup"}
              aria-expanded={isOpen}
            >
              {isOpen ? <IconClose /> : <IconWhatsApp />}
            </button>
          </div>
        )}

        {/* Main FAB: chat icon when closed, cross when panel open */}
        <button
          onClick={isChatPanelOpen ? closeChatPanel : openChatPanel}
          className={`flex items-center justify-center rounded-full p-4 w-14 h-14 transition-all duration-300 ease-out cursor-pointer ${
            isChatPanelOpen
              ? "bg-slate-800/90 backdrop-blur-sm text-slate-200 hover:bg-slate-700 hover:scale-105 shadow-lg border border-slate-700"
              : "bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-2xl hover:shadow-brand-500/50 hover:scale-110 border border-brand-400"
          }`}
          aria-label={isChatPanelOpen ? "Close chat widgets" : "Open chat widgets"}
          aria-expanded={isChatPanelOpen}
        >
          {isChatPanelOpen ? <IconClose /> : <IconChatFAB />}
        </button>
      </div>
    </>
  );
}
