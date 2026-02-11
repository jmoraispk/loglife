import Image from "next/image";

export default function Footer() {
  return (
    <footer id="footer" className="text-slate-300 py-8">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Image
            src="/logo_light.svg"
            alt="LogLife"
            width={100}
            height={25}
            className="h-8 w-auto opacity-80"
          />
          <span className="text-sm text-slate-500">© 2026</span>
        </div>
        
        <div className="flex items-center gap-6 text-sm text-slate-400">
          <a href="https://docs.loglife.co/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">Docs</a>
          <a href="#" className="hover:text-emerald-400 transition-colors">Privacy</a>
          <a href="#" className="hover:text-emerald-400 transition-colors">Terms</a>
          <a href="https://github.com/jmoraispk/loglife" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">GitHub</a>
        </div>
      </div>
    </footer>
  );
}

