
import React from 'react';
import { LogoIcon, TwitterIcon, InstagramIcon, LinkedinIcon, ArrowRightIcon } from './Icons';
import { Link } from 'react-router-dom';

interface FooterProps {
  onAdminClick?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onAdminClick }) => {
  return (
    <footer className="w-full relative z-10 bg-black pt-8 md:pt-16 pb-6 border-t border-brand-pink/20 overflow-hidden">

      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[300px] bg-brand-pink/5 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Background Watermark Text - Unified Scrolling & Blinking */}
      <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 overflow-hidden pointer-events-none z-0 opacity-[0.05]">
        <div className="flex whitespace-nowrap animate-marquee-custom items-center gap-16">
          <span className="font-orbitron font-black text-[20vh] md:text-[25vw] leading-none tracking-widest px-4 select-none force-orbitron animate-flicker-custom" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            BLACK BOX
          </span>
          <span className="font-orbitron font-black text-[20vh] md:text-[25vw] leading-none tracking-widest px-4 select-none force-orbitron animate-flicker-custom" style={{ fontFamily: "'Orbitron', sans-serif", animationDelay: '0.5s' }}>
            BLACK BOX
          </span>
          <span className="font-orbitron font-black text-[20vh] md:text-[25vw] leading-none tracking-widest px-4 select-none force-orbitron animate-flicker-custom" style={{ fontFamily: "'Orbitron', sans-serif", animationDelay: '1s' }}>
            BLACK BOX
          </span>
          <span className="font-orbitron font-black text-[20vh] md:text-[25vw] leading-none tracking-widest px-4 select-none force-orbitron animate-flicker-custom" style={{ fontFamily: "'Orbitron', sans-serif", animationDelay: '1.5s' }}>
            BLACK BOX
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-20">

        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-12 gap-y-8 gap-x-4 md:gap-8 mb-8 md:mb-12">

          {/* Brand Column (Left - 4 cols on desktop, Full width on mobile) */}
          <div className="col-span-2 md:col-span-4 flex flex-col items-start">
            <div className="flex items-center gap-3 mb-4 md:mb-6 group cursor-pointer">
              <LogoIcon className="w-8 h-8 md:w-10 md:h-10 text-brand-pink transition-transform duration-700 ease-in-out group-hover:rotate-[360deg]" />
              <div className="flex flex-col">
                <span className="font-orbitron force-orbitron font-bold text-xl md:text-2xl text-white tracking-widest leading-none transition-colors duration-300 group-hover:text-brand-cyan" style={{ fontFamily: "'Orbitron', sans-serif" }}>BLACK BOX</span>
                <span className="font-orbitron force-orbitron text-[10px] md:text-xs tracking-[0.2em] text-brand-cyan uppercase leading-none mt-1 transition-colors duration-300 group-hover:text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>Think Out of Box</span>
              </div>
            </div>
            <p className="text-brand-gray text-xs md:text-sm leading-relaxed mb-4 md:mb-6 font-poppins max-w-sm">
              Revolutionizing the vending experience with seamless connectivity and instant gratification. Think out of the box.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-brand-pink hover:text-white transition-all duration-300">
                <TwitterIcon className="w-4 h-4 md:w-5 md:h-5" />
              </a>
              <a href="#" className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-brand-pink hover:text-white transition-all duration-300">
                <InstagramIcon className="w-4 h-4 md:w-5 md:h-5" />
              </a>
              <a href="#" className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-brand-pink hover:text-white transition-all duration-300">
                <LinkedinIcon className="w-4 h-4 md:w-5 md:h-5" />
              </a>
            </div>
          </div>

          {/* Spacer */}
          <div className="hidden md:block md:col-span-1"></div>

          {/* Links Column 1 - Company */}
          <div className="col-span-1 md:col-span-2">
            <h4 className="font-orbitron font-bold text-white text-xs md:text-sm tracking-wider uppercase mb-4 md:mb-6 border-l-2 border-brand-cyan pl-3">
              Company
            </h4>
            <ul className="space-y-2 md:space-y-3">
              <li><Link to="/about" className="text-brand-gray hover:text-brand-cyan transition-colors text-xs md:text-sm font-poppins hover:pl-2 transition-all duration-300 block">About</Link></li>
              <li><Link to="/careers" className="text-brand-gray hover:text-brand-cyan transition-colors text-xs md:text-sm font-poppins hover:pl-2 transition-all duration-300 block">Careers</Link></li>
              <li><Link to="/press" className="text-brand-gray hover:text-brand-cyan transition-colors text-xs md:text-sm font-poppins hover:pl-2 transition-all duration-300 block">Press</Link></li>
            </ul>
          </div>

          {/* Links Column 2 - Support */}
          <div className="col-span-1 md:col-span-2">
            <h4 className="font-orbitron font-bold text-white text-xs md:text-sm tracking-wider uppercase mb-4 md:mb-6 border-l-2 border-brand-pink pl-3">
              Support
            </h4>
            <ul className="space-y-2 md:space-y-3">
              <li><Link to="/help-center" className="text-brand-gray hover:text-brand-pink transition-colors text-xs md:text-sm font-poppins hover:pl-2 transition-all duration-300 block">Help Center</Link></li>
              <li><Link to="/terms" className="text-brand-gray hover:text-brand-pink transition-colors text-xs md:text-sm font-poppins hover:pl-2 transition-all duration-300 block">Terms</Link></li>
              <li><Link to="/privacy" className="text-brand-gray hover:text-brand-pink transition-colors text-xs md:text-sm font-poppins hover:pl-2 transition-all duration-300 block">Privacy</Link></li>
            </ul>
          </div>

          {/* Links Column 3 - Contact */}
          <div className="col-span-2 md:col-span-2 mt-2 md:mt-0">
            <h4 className="font-orbitron font-bold text-white text-xs md:text-sm tracking-wider uppercase mb-4 md:mb-6 border-l-2 border-white pl-3">
              Contact
            </h4>
            <ul className="space-y-2 md:space-y-3">
              <li className="text-brand-gray text-xs md:text-sm font-poppins">support@blackbox.io</li>
              <li className="text-brand-gray text-xs md:text-sm font-poppins">+1 (555) 000-0000</li>
              <li className="text-brand-gray text-xs md:text-sm font-poppins">Los Angeles, CA</li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-4 md:pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] md:text-xs text-brand-gray/50 font-mono text-center md:text-left">
            © 2025 Black Box Inc. All systems operational.
          </p>
          <div className="flex gap-4 md:gap-6">
            <a
              href="?admin=true"
              onClick={(e) => {
                if (onAdminClick) {
                  e.preventDefault();
                  onAdminClick();
                }
              }}
              className="text-[10px] md:text-xs text-brand-gray/50 hover:text-white transition-colors cursor-pointer"
            >
              Admin Access
            </a>
            <Link to="/privacy" className="text-[10px] md:text-xs text-brand-gray/50 hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms" className="text-[10px] md:text-xs text-brand-gray/50 hover:text-white transition-colors">Cookies</Link>
            <Link to="/about" className="text-[10px] md:text-xs text-brand-gray/50 hover:text-white transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
