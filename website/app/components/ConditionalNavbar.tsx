"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function ConditionalNavbar() {
  const pathname = usePathname();
  const isCallPage = pathname?.startsWith("/call");

  if (isCallPage) {
    return null;
  }

  return <Sidebar />;
}

