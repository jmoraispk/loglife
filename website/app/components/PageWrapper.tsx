"use client";

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-20 md:pt-0">
      {children}
    </div>
  );
}

