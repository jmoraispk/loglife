import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-slate-100 z-50">
      <div className="container mx-auto px-12 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center group">
            <div className="flex items-center overflow-visible transition-transform duration-200 group-hover:scale-[1.02]">
              <Image
                src="/logo.svg"
                alt="LogLife"
                width={140}
                height={35}
                className="h-11 w-auto"
                priority
              />
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/#how-it-works"
              className="text-slate-600 hover:text-emerald-600 font-medium transition-colors"
            >
              How it works
            </Link>
            <Link
              href="/#guides"
              className="text-slate-600 hover:text-emerald-600 font-medium transition-colors"
            >
              Guides
            </Link>
            <Link
              href="/#about"
              className="text-slate-600 hover:text-emerald-600 font-medium transition-colors"
            >
              About
            </Link>
            <Link
              href="/#roadmap"
              className="text-slate-600 hover:text-emerald-600 font-medium transition-colors"
            >
              Roadmap
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <a
              href="https://wa.me/17155157761?text=help"
              className="hidden sm:inline-flex items-center px-5 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-all shadow-sm hover:shadow-md"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="currentColor"
                viewBox="0 0 512 512"
              >
                <path d="M156.6 384.9L125.7 354c-8.5-8.5-11.5-20.8-7.7-32.2c3-8.9 7-20.5 11.8-33.8L24 288c-8.6 0-16.6-4.6-20.9-12.1s-4.2-16.7 .2-24.1l52.5-88.5c13-21.9 36.5-35.3 61.9-35.3l82.3 0c2.4-4 4.8-7.7 7.2-11.3C289.1-4.1 411.1-8.1 483.9 5.3c11.6 2.1 20.6 11.2 22.8 22.8c13.4 72.9 9.3 194.8-111.4 276.7c-3.5 2.4-7.3 4.8-11.3 7.2v82.3c0 25.4-13.4 49-35.3 61.9l-88.5 52.5c-7.4 4.4-16.6 4.5-24.1 .2s-12.1-12.2-12.1-20.9V380.8c-14.1 4.9-26.4 8.9-35.7 11.9c-11.2 3.6-23.4 .5-31.8-7.8zM384 168a40 40 0 1 0 0-80 40 40 0 1 0 0 80z" />
              </svg>
              Start your log
            </a>
            <button className="md:hidden text-slate-600 hover:text-emerald-600 p-2 rounded-lg transition-colors duration-200">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

