import { logoUrl } from "../../data/content";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0b0f14] py-10 border-t border-white/5" role="contentinfo">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <img 
            src={logoUrl} 
            alt="Saralo Logo" 
            className="h-6 w-auto opacity-50 grayscale contrast-125"
          />
          <span className="text-slate-600 text-xs tracking-wider">© {currentYear}</span>
        </div>

        <div className="flex items-center gap-8 text-xs font-medium text-slate-400" aria-label="Footer navigation">
          <a href="#" id="footer-privacy" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" id="footer-terms" className="hover:text-white transition-colors">Terms of Use</a>
          <a href="#" id="footer-accessibility" className="hover:text-white transition-colors">Accessibility</a>
        </div>
      </div>
    </footer>
  );
}
