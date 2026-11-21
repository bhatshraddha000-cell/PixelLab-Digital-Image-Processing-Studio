import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Layers, Info, Home, ChevronRight, Activity, Database, Cpu, RefreshCw, ChevronDown } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import apiService from '../services/api';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showHealthMenu, setShowHealthMenu] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [health, setHealth] = useState({
    loading: true,
    api: { status: 'checking', ready: false },
    database: { status: 'checking', ready: false },
    opencv: { status: 'checking', ready: false },
  });

  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  // Handle sticky navbar background on scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close health popover on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowHealthMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Probe service health with proper unmount cleanup
  const checkHealth = async () => {
    setIsRefreshing(true);
    try {
      const data = await apiService.getHealth();
      setHealth({
        loading: false,
        api: data.services?.api || { status: 'online', ready: true },
        database: data.services?.database || { status: 'disconnected', ready: false },
        opencv: data.services?.opencv || { status: 'offline', ready: false },
      });
    } catch (err) {
      setHealth({
        loading: false,
        api: { status: 'offline', ready: false, message: 'Express server unreachable' },
        database: { status: 'offline', ready: false },
        opencv: { status: 'offline', ready: false },
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    checkHealth();

    // Periodic health check every 30 seconds
    const intervalId = setInterval(() => {
      if (isMounted) checkHealth();
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // Smooth scroll handler
  const scrollToSection = (sectionId) => {
    setIsOpen(false);
    if (location.pathname !== '/') {
      navigate(`/#${sectionId}`);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const getStatusBadge = (status, ready) => {
    if (ready || status === 'online' || status === 'connected') {
      return { dot: 'bg-emerald-500 animate-pulse', text: 'Connected', color: 'text-emerald-700 dark:text-emerald-400' };
    }
    if (status === 'checking') {
      return { dot: 'bg-amber-400 animate-ping', text: 'Checking', color: 'text-amber-700 dark:text-amber-400' };
    }
    return { dot: 'bg-rose-500', text: 'Offline', color: 'text-rose-700 dark:text-rose-400' };
  };

  const apiBadge = getStatusBadge(health.api.status, health.api.ready);
  const dbBadge = getStatusBadge(health.database.status, health.database.ready);
  const cvBadge = getStatusBadge(health.opencv.status, health.opencv.ready);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
          ? 'bg-white/95 dark:bg-navy-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/90 shadow-md'
          : 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm border-b border-slate-200/60 dark:border-slate-800/50'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">

          {/* Logo & Brand Identity */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-violet-600 p-0.5 shadow-md shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-shadow">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center overflow-hidden">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-cyan-400 group-hover:rotate-45 transition-transform duration-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" stroke="#06b6d4" strokeOpacity="0.5" />
                  <line x1="14.31" y1="8" x2="20.05" y2="17.94" stroke="#38bdf8" />
                  <line x1="9.69" y1="8" x2="21.17" y2="8" stroke="#06b6d4" />
                  <line x1="7.38" y1="12" x2="13.12" y2="2.06" stroke="#818cf8" />
                  <line x1="9.69" y1="16" x2="3.95" y2="6.06" stroke="#a78bfa" />
                  <line x1="14.31" y1="16" x2="2.83" y2="16" stroke="#c084fc" />
                  <line x1="16.62" y1="12" x2="10.88" y2="21.94" stroke="#38bdf8" />
                </svg>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
                  Pixel<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600 dark:from-cyan-400 dark:to-blue-400">Lab</span>
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800/60 font-semibold">
                  CV STUDIO
                </span>
              </div>
              <span className="text-[10px] text-slate-600 dark:text-slate-400 tracking-wider font-medium hidden sm:block">
                Digital Image Processing
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1.5 ${location.pathname === '/'
                  ? 'text-cyan-700 bg-cyan-50 border border-cyan-200 dark:text-cyan-400 dark:bg-cyan-950/40 dark:border-cyan-800/40'
                  : 'text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>

            <button
              onClick={() => scrollToSection('modules')}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>Explore Modules</span>
            </button>

            <button
              onClick={() => scrollToSection('about')}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Info className="w-4 h-4" />
              <span>About Project</span>
            </button>
          </nav>

          {/* Right utility items: Granular Health Statuses + Theme Toggle */}
          <div className="flex items-center space-x-3">

            {/* Multi-Service Health Indicator Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowHealthMenu(!showHealthMenu)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-mono bg-slate-100 dark:bg-navy-900 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-700 transition-colors shadow-sm"
                title="Service Status Dashboard"
              >
                <div className="flex items-center space-x-1.5">
                  <span className={`w-2 h-2 rounded-full ${apiBadge.dot}`} />
                  <span className="font-semibold hidden lg:inline">Express</span>
                </div>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <div className="flex items-center space-x-1.5">
                  <span className={`w-2 h-2 rounded-full ${cvBadge.dot}`} />
                  <span className="font-semibold hidden lg:inline">OpenCV</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {/* Service Health Popover */}
              {showHealthMenu && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-4 z-50 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      Service Health Monitor
                    </span>
                    <button
                      onClick={checkHealth}
                      disabled={isRefreshing}
                      className="p-1 rounded-lg text-slate-500 hover:text-cyan-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Re-check status now"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    {/* Express Backend */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-blue-500" />
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-200">Express API</div>
                          <div className="text-[10px] text-slate-500">Port {health.api.port || 5000}</div>
                        </div>
                      </div>
                      <span className={`font-mono font-semibold ${apiBadge.color}`}>{apiBadge.text}</span>
                    </div>

                    {/* MongoDB Database */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center space-x-2">
                        <Database className="w-4 h-4 text-emerald-500" />
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-200">MongoDB</div>
                          <div className="text-[10px] text-slate-500">
                            {health.database.ready ? 'Storage Online' : 'Memory Cache Fallback'}
                          </div>
                        </div>
                      </div>
                      <span className={`font-mono font-semibold ${dbBadge.color}`}>{dbBadge.text}</span>
                    </div>

                    {/* Python OpenCV Service */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center space-x-2">
                        <Cpu className="w-4 h-4 text-cyan-500" />
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-200">Python OpenCV</div>
                          <div className="text-[10px] text-slate-500">Port 8000 (FastAPI)</div>
                        </div>
                      </div>
                      <span className={`font-mono font-semibold ${cvBadge.color}`}>{cvBadge.text}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 font-mono text-center">
                    Auto-probes every 30s • Client & Express Synced
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle Component */}
            <ThemeToggle />

            {/* Mobile menu hamburger toggle */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle navigation menu"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {isOpen && (
        <div className="md:hidden bg-white/98 dark:bg-navy-950/98 border-b border-slate-200 dark:border-slate-800 px-4 pt-3 pb-6 space-y-3 backdrop-blur-xl">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-between p-3 rounded-lg text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
          >
            <div className="flex items-center space-x-3">
              <Home className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span className="font-semibold">Home</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>

          <button
            onClick={() => scrollToSection('modules')}
            className="w-full flex items-center justify-between p-3 rounded-lg text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-left cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold">Explore Modules</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => scrollToSection('about')}
            className="w-full flex items-center justify-between p-3 rounded-lg text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-left cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <Info className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <span className="font-semibold">About Project</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
