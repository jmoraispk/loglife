import "./globals.css";
import type { Metadata } from "next";
import ConditionalNavbar from "./components/ConditionalNavbar";
import WhatsAppWidget from "./components/WhatsAppWidget";
import PageWrapper from "./components/PageWrapper";
import { ThemeProvider } from "./contexts/ThemeContext";
import { WhatsAppWidgetProvider } from "./contexts/WhatsAppWidgetContext";

export const metadata: Metadata = {
  title: "LogLife",
  description:
    "Audio-first, chat-native journaling that helps you notice patterns and act.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <WhatsAppWidgetProvider>
            <ConditionalNavbar />
            <PageWrapper>{children}</PageWrapper>
            <WhatsAppWidget />
          </WhatsAppWidgetProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
