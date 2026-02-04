"use client";

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-24 lg:pt-0 lg:pl-24 transition-[padding] duration-300">
      {children}
    </div>
  );
}

