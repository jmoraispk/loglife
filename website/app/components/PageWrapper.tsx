"use client";

import { usePathname } from "next/navigation";

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCallPage = pathname?.startsWith("/call");

  return (
    <div className={isCallPage ? "" : "pt-[65px]"}>
      {children}
    </div>
  );
}

