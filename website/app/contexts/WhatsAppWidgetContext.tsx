"use client";
import { createContext, useContext, useState, ReactNode } from "react";

interface WhatsAppWidgetContextType {
  isOpen: boolean;
  isVisible: boolean;
  openWidget: () => void;
  closeWidget: () => void;
  toggleWidget: () => void;
  hideWidgetButton: () => void;
  showWidgetButton: () => void;
}

const WhatsAppWidgetContext = createContext<WhatsAppWidgetContextType | undefined>(undefined);

export function WhatsAppWidgetProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const openWidget = () => {
    setIsOpen(true);
  };

  const closeWidget = () => {
    setIsOpen(false);
  };

  const toggleWidget = () => {
    setIsOpen((prev) => !prev);
  };

  const hideWidgetButton = () => setIsVisible(false);
  const showWidgetButton = () => setIsVisible(true);

  const value = {
    isOpen,
    isVisible,
    openWidget,
    closeWidget,
    toggleWidget,
    hideWidgetButton,
    showWidgetButton,
  };

  return (
    <WhatsAppWidgetContext.Provider value={value}>
      {children}
    </WhatsAppWidgetContext.Provider>
  );
}

export function useWhatsAppWidget() {
  const context = useContext(WhatsAppWidgetContext);
  if (context === undefined) {
    throw new Error("useWhatsAppWidget must be used within a WhatsAppWidgetProvider");
  }
  return context;
}

