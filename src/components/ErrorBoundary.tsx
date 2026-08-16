import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  moduleName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Uncaught error in ErrorBoundary (${this.props.moduleName || 'Unknown Module'}):`, error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900/30 m-4 shadow-sm h-[calc(100%-2rem)]">
          <div className="bg-red-100 dark:bg-red-900/50 p-4 rounded-full mb-4">
            <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2 text-center">
            {this.props.moduleName ? `${this.props.moduleName} Crashed` : 'Something went wrong.'}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-lg text-center mb-6 text-sm">
            We encountered an unexpected error while rendering this view. Don't worry, the rest of the application is still running smoothly.
          </p>
          
          {this.state.error && (
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-auto mb-6 text-left">
              <p className="text-xs font-mono text-red-600 dark:text-red-400 whitespace-pre-wrap break-words">
                {this.state.error.toString()}
              </p>
            </div>
          )}

          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/50"
          >
            <RefreshCcw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
