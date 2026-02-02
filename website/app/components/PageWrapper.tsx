"use client";

import { usePathname } from "next/navigation";

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCallPage = pathname?.startsWith("/call");

  return (
    <div className={isCallPage ? "" : "pl-16"}>
      {children}
    </div>
  );
}

