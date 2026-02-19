import "./globals.css";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import ConditionalNavbar from "./components/ConditionalNavbar";
import PageWrapper from "./components/PageWrapper";
import { ThemeProvider } from "./contexts/ThemeContext";
import { WhatsAppWidgetProvider } from "./contexts/WhatsAppWidgetContext";
import WhatsAppWidget from "./components/WhatsAppWidget";
import { WebVitals } from "./components/WebVitals";

export const metadata: Metadata = {
  title: "LogLife — Effortless Tracking, in Chat",
  description:
    "Turns your chat into a life log with habit tracking and wearable integration. AI listens, remembers, and surfaces patterns — without coaching you. Open source. No app to download.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#128c7e",
          colorBackground: "#0f172a",
          colorInputBackground: "#020617",
          colorInputText: "#ffffff",
          colorText: "#ffffff",
          colorTextSecondary: "#94a3b8",
        },
        elements: {
          // General
          card: "!bg-slate-900 !border !border-slate-800",
          formButtonPrimary: "!bg-emerald-600 hover:!bg-emerald-500",
          
          // UserButton Popover
          userButtonPopoverCard: "!bg-slate-900 !border !border-slate-700 !shadow-xl",
          userButtonPopoverMain: "!bg-slate-900",
          userButtonPopoverFooter: "!hidden",
          userButtonPopoverActions: "!bg-slate-900",
          userButtonPopoverActionButton: "!text-white hover:!bg-slate-800",
          userButtonPopoverActionButtonText: "!text-white !font-medium",
          userButtonPopoverActionButtonIcon: "!text-white",
          userPreview: "!bg-slate-900",
          userPreviewMainIdentifier: "!text-white !font-semibold",
          userPreviewSecondaryIdentifier: "!text-slate-400",
          
          // UserProfile Modal
          modalBackdrop: "!bg-black/60 !backdrop-blur-sm",
          modalContent: "!bg-slate-900 !border !border-slate-700 !shadow-2xl",
          rootBox: "!bg-slate-900",
          cardBox: "!bg-slate-900",
          navbar: "!bg-slate-900/80 !border-r !border-slate-700",
          navbarButton: "!text-slate-300 hover:!bg-slate-800 hover:!text-white",
          navbarButtonIcon: "!text-slate-400",
          navbarButtons: "!bg-transparent",
          pageScrollBox: "!bg-slate-900",
          page: "!bg-slate-900",
          profilePage: "!bg-slate-900",
          profileSection: "!bg-slate-900",
          profileSectionTitle: "!text-white !font-semibold !text-lg",
          profileSectionTitleText: "!text-white",
          profileSectionSubtitle: "!text-slate-400",
          profileSectionContent: "!text-slate-300",
          profileSectionPrimaryButton: "!text-emerald-400 hover:!text-emerald-300",
          formFieldLabel: "!text-slate-300",
          formFieldInput: "!bg-slate-950 !border-slate-700 !text-white",
          formFieldHintText: "!text-slate-500",
          accordionTriggerButton: "!text-white hover:!bg-slate-800",
          accordionContent: "!bg-slate-900",
          breadcrumbs: "!bg-slate-900",
          breadcrumbsItem: "!text-slate-400",
          breadcrumbsItemDivider: "!text-slate-600",
          headerTitle: "!text-white !font-bold",
          headerSubtitle: "!text-slate-400",
          footer: "!hidden",
          badge: "!bg-slate-700 !text-slate-300",
          tagInputContainer: "!bg-slate-950 !border-slate-700",
          activeDevice: "!bg-slate-800 !border-slate-700",
          activeDeviceIcon: "!text-slate-400",
          scrollBox: "!bg-slate-900",
        },
      }}
    >
      <html lang="en">
        <body>
          <WebVitals />
          <ThemeProvider>
            <WhatsAppWidgetProvider>
              <ConditionalNavbar />
              <PageWrapper>{children}</PageWrapper>
              <WhatsAppWidget />
            </WhatsAppWidgetProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
