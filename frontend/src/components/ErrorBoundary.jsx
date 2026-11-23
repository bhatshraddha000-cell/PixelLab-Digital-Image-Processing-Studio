import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Robust React Error Boundary to catch render-time exceptions,
 * prevent blank/dark screens, and provide informative recovery actions.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled React Render Error in ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          resetErrorBoundary: this.handleReset,
        });
      }

      return (
        <div className="p-6 sm:p-8 rounded-3xl bg-red-50/90 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 my-6 shadow-sm text-center space-y-4">
          <div className="inline-flex p-3 rounded-2xl bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-red-900 dark:text-red-200">
              {this.props.title || 'Workspace Rendering Interrupted'}
            </h3>
            <p className="text-xs text-red-700 dark:text-red-300 max-w-xl mx-auto">
              An unexpected error occurred while rendering the workspace data. The application prevented a blank screen and preserved your session.
            </p>
          </div>

          {this.state.error && (
            <div className="p-3 rounded-xl bg-slate-900 text-slate-200 text-left font-mono text-[11px] overflow-x-auto max-w-2xl mx-auto border border-slate-800">
              <span className="text-red-400 font-bold">{this.state.error.name}: </span>
              {this.state.error.message}
            </div>
          )}

          <div className="flex items-center justify-center space-x-3 pt-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center space-x-2 shadow-sm cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry / Reset View</span>
            </button>
            <Link
              to="/"
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-navy-800 hover:bg-slate-100 dark:hover:bg-navy-700 border border-slate-200 dark:border-slate-700 transition-colors flex items-center space-x-2 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Return to Studio</span>
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

