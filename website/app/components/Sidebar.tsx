"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();

  if (pathname?.startsWith("/call")) {
    return null;
  }

  const isSignedIn = isLoaded && user;

  // Active link detection — supports prefix matching for /blog sub-pages
  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href) || false;
  }

  // Nav link helper — external links get target="_blank"
  function NavLink({ item, className }: { item: { href: string; icon: React.ReactNode; label: string }; className: string }) {
    const isExternal = item.href.startsWith("http");
    if (isExternal) {
      return (
        <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
          {item.icon}
          <span className="text-sm whitespace-nowrap opacity-0 xl:group-hover:opacity-100 transition-opacity duration-300">
            {item.label}
          </span>
        </a>
      );
    }
    return (
      <Link href={item.href} className={className}>
        {item.icon}
        <span className="text-sm whitespace-nowrap opacity-0 xl:group-hover:opacity-100 transition-opacity duration-300">
          {item.label}
        </span>
      </Link>
    );
  }

  // Mobile nav link — label is always hidden on md:block
  function MobileNavLink({ item, className }: { item: { href: string; icon: React.ReactNode; label: string }; className: string }) {
    const isExternal = item.href.startsWith("http");
    if (isExternal) {
      return (
        <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
          {item.icon}
          <span className="text-sm whitespace-nowrap hidden md:block">{item.label}</span>
        </a>
      );
    }
    return (
      <Link href={item.href} className={className}>
        {item.icon}
        <span className="text-sm whitespace-nowrap hidden md:block">{item.label}</span>
      </Link>
    );
  }

  // Nav items for signed-out users
  const publicNavItems = [
    { 
      href: "/", 
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      label: "Home"
    },
    { 
      href: "/features", 
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      label: "Features"
    },
    { 
      href: "/pricing", 
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: "Pricing"
    },
    { 
      href: "/blog", 
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      ),
      label: "Blog"
    },
    { 
      href: "https://docs.loglife.co/", 
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      label: "Docs"
    },
  ];

  // Signed-in: main nav (Home, Features, Blog, Pricing) then divider then user nav (Dashboard, Account)
  const authNavItemsMain = [
    { href: "/", icon: (<svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>), label: "Home" },
    { href: "/features", icon: (<svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>), label: "Features" },
    { href: "/pricing", icon: (<svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>), label: "Pricing" },
    { href: "/blog", icon: (<svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>), label: "Blog" },
    { href: "https://docs.loglife.co/", icon: (<svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>), label: "Docs" },
  ];
  const authNavItemsUser = [
    { href: "/dashboard", icon: (<svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>), label: "Dashboard" },
    { href: "/account", icon: (<svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>), label: "Account" },
  ];

  const dividerHorizontal = (
    <div className="w-full h-px my-2 bg-gradient-to-r from-transparent via-slate-500/50 to-transparent shrink-0" aria-hidden />
  );
  const dividerVertical = (
    <div className="h-4 w-px mx-1 shrink-0 bg-gradient-to-b from-transparent via-slate-500/50 to-transparent" aria-hidden />
  );

  return (
    <>
      {/* Top Navigation Bar - visible below lg */}
      <nav className="lg:hidden fixed top-4 left-4 right-4 h-14 flex items-center justify-between px-4 z-50 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
        {/* Logo */}
        <Link href={isSignedIn ? "/dashboard" : "/#hero"} className="flex items-center gap-2">
          <div className="relative w-6 h-6 shrink-0">
            <Image
              src="/icon-small.svg"
              alt="LogLife"
              fill
              className="object-contain"
            />
          </div>
          <span className="text-sm font-semibold text-white hidden sm:block">
            LogLife
          </span>
        </Link>

        {/* Navigation Items */}
        <div className="flex items-center gap-1 sm:gap-2">
          {isSignedIn ? (
            <>
              {authNavItemsMain.map((item, index) => (
                <MobileNavLink key={index} item={item} className={`h-9 flex items-center gap-2 px-2 sm:px-3 rounded-lg transition-colors ${isActive(item.href) ? "text-emerald-400 bg-emerald-500/10" : "text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10"}`} />
              ))}
              {dividerVertical}
              {authNavItemsUser.map((item, index) => (
                <MobileNavLink key={index} item={item} className={`h-9 flex items-center gap-2 px-2 sm:px-3 rounded-lg transition-colors ${isActive(item.href) ? "text-emerald-400 bg-emerald-500/10" : "text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10"}`} />
              ))}
            </>
          ) : (
            publicNavItems.map((item, index) => (
              <MobileNavLink key={index} item={item} className={`h-9 flex items-center gap-2 px-2 sm:px-3 rounded-lg transition-colors ${isActive(item.href) ? "text-emerald-400 bg-emerald-500/10" : "text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10"}`} />
            ))
          )}
        </div>

        {/* Sign In - only when signed out */}
        {!isSignedIn && (
          <Link 
            href="/login" 
            className="h-9 flex items-center gap-2 px-2 sm:px-3 rounded-lg transition-colors text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-sm whitespace-nowrap hidden sm:block">
              Sign In
            </span>
          </Link>
        )}
      </nav>

      {/* Side Navigation Bar - visible at lg and above */}
      <aside className="group hidden lg:flex fixed left-4 top-1/2 -translate-y-1/2 w-14 xl:hover:w-40 flex-col items-center py-5 transition-all duration-300 ease-in-out z-50 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
        
        {/* Logo */}
        <div className="shrink-0 px-3 w-full">
          <Link href={isSignedIn ? "/dashboard" : "/#hero"} className="w-full h-9 flex items-center gap-3 px-2">
            <div className="block relative w-4 h-4 shrink-0 opacity-100 transition-opacity">
              <Image
                src="/icon-small.svg"
                alt="LogLife"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-sm font-semibold text-white whitespace-nowrap opacity-0 xl:group-hover:opacity-100 transition-opacity duration-300">
              LogLife
            </span>
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="flex flex-col items-start justify-center space-y-1 w-full px-3 mt-8">
          {isSignedIn ? (
            <>
              {authNavItemsMain.map((item, index) => (
                <NavLink
                  key={index}
                  item={item}
                  className={`w-full h-9 flex items-center gap-3 px-2 rounded-lg transition-colors ${
                    isActive(item.href) 
                      ? "text-emerald-400 bg-emerald-500/10" 
                      : "text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                  }`}
                />
              ))}
              {dividerHorizontal}
              {authNavItemsUser.map((item, index) => (
                <NavLink
                  key={index}
                  item={item}
                  className={`w-full h-9 flex items-center gap-3 px-2 rounded-lg transition-colors ${
                    isActive(item.href) 
                      ? "text-emerald-400 bg-emerald-500/10" 
                      : "text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                  }`}
                />
              ))}
            </>
          ) : (
            publicNavItems.map((item, index) => (
              <NavLink
                key={index}
                item={item}
                className={`w-full h-9 flex items-center gap-3 px-2 rounded-lg transition-colors ${
                  isActive(item.href) 
                    ? "text-emerald-400 bg-emerald-500/10" 
                    : "text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                }`}
              />
            ))
          )}
        </div>

        {/* Sign In - only when signed out */}
        {!isSignedIn && (
          <div className="mt-8 shrink-0 px-3 w-full">
            <Link 
              href="/login" 
              className="w-full h-9 flex items-center gap-3 px-2 rounded-lg transition-colors text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-sm whitespace-nowrap opacity-0 xl:group-hover:opacity-100 transition-opacity duration-300">
                Sign In
              </span>
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
