import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-radial-glow opacity-30 pointer-events-none"></div>

      <div className="max-w-lg w-full text-center space-y-6 relative z-10 p-8 rounded-2xl bg-slate-900/60 dark:bg-navy-900/80 border border-slate-800 shadow-2xl backdrop-blur-md">
        
        {/* Visual 404 Radar / Aperture lost signal */}
        <div className="mx-auto w-24 h-24 rounded-2xl bg-gradient-to-br from-red-500/20 via-slate-800 to-slate-900 border border-red-500/30 flex items-center justify-center">
          <AlertCircle className="w-12 h-12 text-red-400 animate-pulse" />
        </div>

        <div className="space-y-2">
          <div className="text-xs font-mono uppercase tracking-widest text-red-400">
            Error 404 • Out of Image Coordinate Bounds
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Pixel Coordinates Not Found
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            The processing route you requested does not exist in the PixelLab Studio workspace. It may have been relocated or does not match our defined experimental pipelines.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-medium text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors flex items-center justify-center space-x-2"
          >
            <Home className="w-4 h-4" />
            <span>Return to Studio Home</span>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors flex items-center justify-center space-x-2 border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default NotFound;

