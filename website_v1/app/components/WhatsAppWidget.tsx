"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useWhatsAppWidget } from "../contexts/WhatsAppWidgetContext";

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

function IconClose() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
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
  const number = "17155157761"; 
  const message = "help";
  const link = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(false);
    }
  }, [isOpen]);

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

      <button
        onClick={handleToggle}
        className={`fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full p-4 transition-all duration-300 ease-out cursor-pointer ${
          isOpen 
            ? "bg-slate-800/90 backdrop-blur-sm text-slate-200 hover:bg-slate-700 hover:scale-105 shadow-lg border border-slate-700 rotate-90"
            : "bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-2xl hover:shadow-brand-500/50 hover:scale-110 border border-brand-400 rotate-0"
        }`}
        aria-label={isOpen ? "Close WhatsApp popup" : "Open WhatsApp popup"}
        aria-expanded={isOpen}
      >
        {isOpen ? <IconClose /> : <IconWhatsApp />}
      </button>
    </>
  );
}
