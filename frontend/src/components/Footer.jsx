import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, Terminal, ArrowUpRight } from 'lucide-react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const moduleLinks = [
    { name: '01. Image Enhancement', path: '/modules/enhancement' },
    { name: '02. Morphological Object Separation', path: '/modules/morphology' },
    { name: '03. Watershed Segmentation', path: '/modules/watershed' },
    { name: '04. Geometrical Object Classification', path: '/modules/classification' },
  ];

  const quickLinks = [
    { name: 'Home Studio', path: '/' },
    { name: 'Explore All Modules', path: '/#modules' },
    { name: 'About Project', path: '/#about' },
    { name: 'Backend Health Check', path: 'http://localhost:5000/api/health', external: true },
  ];

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-slate-100 dark:bg-navy-950 text-slate-600 dark:text-slate-400 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-slate-200 dark:border-slate-800/80">
          
          {/* Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-violet-600 p-0.5">
                <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" stroke="#06b6d4" />
                    <line x1="14.31" y1="8" x2="20.05" y2="17.94" stroke="#38bdf8" />
                    <line x1="9.69" y1="8" x2="21.17" y2="8" stroke="#06b6d4" />
                    <line x1="7.38" y1="12" x2="13.12" y2="2.06" stroke="#818cf8" />
                    <line x1="9.69" y1="16" x2="3.95" y2="6.06" stroke="#a78bfa" />
                    <line x1="14.31" y1="16" x2="2.83" y2="16" stroke="#c084fc" />
                  </svg>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Pixel<span className="text-cyan-600 dark:text-cyan-400">Lab</span>
                </span>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono tracking-wider font-semibold">
                  Digital Image Processing Studio
                </span>
              </div>
            </Link>

            <p className="text-sm text-slate-700 dark:text-slate-300 max-w-sm leading-relaxed font-medium">
              Explore Images. Process Intelligence. Discover Results. An interactive computer vision laboratory demonstrating classical image processing techniques with scientific precision.
            </p>

            <div className="pt-2 flex items-center space-x-2 text-xs font-mono font-semibold text-cyan-700 dark:text-cyan-400">
              <Terminal className="w-4 h-4" />
              <span>Full-Stack DIP Laboratory Foundation</span>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-slate-900 dark:text-slate-300 font-bold">
              Navigation
            </h4>
            <ul className="space-y-2 text-sm font-medium">
              {quickLinks.map((link, idx) => (
                <li key={idx}>
                  {link.external ? (
                    <a
                      href={link.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors flex items-center space-x-1"
                    >
                      <span>{link.name}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                    </a>
                  ) : (
                    <Link to={link.path} className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Four Module Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-slate-900 dark:text-slate-300 font-bold">
              Processing Modules
            </h4>
            <ul className="space-y-2 text-sm font-medium">
              {moduleLinks.map((mod, idx) => (
                <li key={idx}>
                  <Link
                    to={mod.path}
                    className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors flex items-center space-x-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 dark:bg-cyan-400"></span>
                    <span>{mod.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom Credits & Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-mono font-medium space-y-2 sm:space-y-0">
          <div>
            © {currentYear} PixelLab Studio. All rights reserved.
          </div>
          <div className="flex items-center space-x-4">
            <span>React • Vite • Express • MongoDB • OpenCV</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
