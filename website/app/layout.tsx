import "./globals.css";
import type { Metadata } from "next";
import Navbar from "./components/Navbar";
import WhatsAppWidget from "./components/WhatsAppWidget";

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
        <Navbar />
        <div className="pt-[65px]">{children}</div>
        <WhatsAppWidget />
      </body>
    </html>
  );
}
