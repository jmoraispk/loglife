import "./globals.css";
import type { Metadata } from "next";
import ConditionalNavbar from "./components/ConditionalNavbar";
import PageWrapper from "./components/PageWrapper";
import { ThemeProvider } from "./contexts/ThemeContext";

export const metadata: Metadata = {
  title: "AutoClaw — Deploy OpenClaw in Minutes",
  description:
    "One-click deployment for OpenClaw agents. Auto deploy, monitor, and track costs across all APIs your agent uses. No SSH, no server hassles.",
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
          <ConditionalNavbar />
          <PageWrapper>{children}</PageWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
