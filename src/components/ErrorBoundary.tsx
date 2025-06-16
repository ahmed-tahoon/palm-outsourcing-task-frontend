'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  enableRetry?: boolean;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
  isolate?: boolean;
  level?: 'page' | 'section' | 'component';
}

/**
 * Advanced Error Boundary Component
 * 
 * Features:
 * - Automatic error recovery with retry logic
 * - Error reporting and logging
 * - Graceful fallback UI
 * - Development vs production error handling
 * - Error isolation levels
 * - Props-based reset functionality
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;
  private previousResetKeys: Array<string | number> = [];

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    };

    this.previousResetKeys = props.resetKeys || [];
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.group('🚨 Error Boundary Caught Error');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();

    this.setState({ errorInfo });

    // Report error to monitoring service
    this.reportError(error, errorInfo);

    // Call custom error handler
    if (this.props.onError && this.state.errorId) {
      this.props.onError(error, errorInfo, this.state.errorId);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset on props change if enabled
    if (hasError && resetOnPropsChange && this.hasResetKeysChanged(prevProps.resetKeys)) {
      this.resetErrorBoundary();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
    }
  }

  private hasResetKeysChanged = (prevResetKeys?: Array<string | number>): boolean => {
    const { resetKeys = [] } = this.props;
    const prevKeys = prevResetKeys || [];

    if (resetKeys.length !== prevKeys.length) {
      return true;
    }

    return resetKeys.some((key, index) => key !== prevKeys[index]);
  };

  private reportError = async (error: Error, errorInfo: ErrorInfo): Promise<void> => {
    try {
      // In a real application, you would send this to your error reporting service
      // Example: Sentry, LogRocket, Bugsnag, etc.
      
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        errorId: this.state.errorId,
        level: this.props.level || 'component',
        retryCount: this.state.retryCount,
      };

      // Mock error reporting (replace with actual service)
      if (process.env.NODE_ENV === 'development') {
        console.log('Error Report:', errorReport);
      } else {
        // await errorReportingService.captureException(errorReport);
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    });
  };

  private handleRetry = (): void => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      console.warn(`Max retries (${maxRetries}) exceeded for error boundary`);
      return;
    }

    this.setState(prevState => ({
      retryCount: prevState.retryCount + 1,
    }));

    // Reset after a short delay to allow for any cleanup
    this.resetTimeoutId = window.setTimeout(() => {
      this.resetErrorBoundary();
    }, 1000);
  };

  private renderFallbackUI = (): ReactNode => {
    const { fallback, level = 'component' } = this.props;
    const { error, retryCount, errorId } = this.state;

    if (!error) return null;

    // Use custom fallback if provided
    if (fallback) {
      return fallback(error, this.handleRetry);
    }

    // Default fallback UI based on error level
    return (
      <div 
        className={`
          flex flex-col items-center justify-center p-8 
          ${level === 'page' ? 'min-h-screen' : 'min-h-[200px]'}
          bg-gray-50 border border-gray-200 rounded-lg
        `}
        role="alert"
        aria-live="assertive"
      >
        <div className="text-center max-w-md">
          {/* Error Icon */}
          <div className="mx-auto mb-4 w-16 h-16 text-red-500">
            <svg 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              className="w-full h-full"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" 
              />
            </svg>
          </div>

          {/* Error Message */}
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {level === 'page' ? 'Something went wrong' : 'Unable to load content'}
          </h2>
          
          <p className="text-gray-600 mb-6">
            {process.env.NODE_ENV === 'development' ? (
              <details className="text-left">
                <summary className="cursor-pointer font-medium mb-2">
                  Error Details (Development)
                </summary>
                <pre className="text-xs bg-gray-100 p-3 rounded border overflow-auto">
                  {error.message}
                  {'\n\n'}
                  {error.stack}
                </pre>
              </details>
            ) : (
              `We encountered an unexpected error. ${
                this.props.enableRetry ? 'Please try again.' : 'Please refresh the page.'
              }`
            )}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {this.props.enableRetry && (
              <button
                onClick={this.handleRetry}
                disabled={retryCount >= (this.props.maxRetries || 3)}
                className="
                  px-4 py-2 bg-blue-600 text-white rounded-md font-medium
                  hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  disabled:bg-gray-400 disabled:cursor-not-allowed
                  transition-colors duration-200
                "
                aria-label={`Retry loading content (attempt ${retryCount + 1})`}
              >
                {retryCount > 0 ? `Retry (${retryCount}/${this.props.maxRetries || 3})` : 'Try Again'}
              </button>
            )}
            
            <button
              onClick={() => window.location.reload()}
              className="
                px-4 py-2 bg-gray-600 text-white rounded-md font-medium
                hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                transition-colors duration-200
              "
              aria-label="Refresh the page"
            >
              Refresh Page
            </button>
          </div>

          {/* Error ID for support */}
          {errorId && (
            <p className="text-xs text-gray-500 mt-4">
              Error ID: <code className="bg-gray-100 px-1 rounded">{errorId}</code>
            </p>
          )}
        </div>
      </div>
    );
  };

  render(): ReactNode {
    const { hasError } = this.state;
    const { children, isolate } = this.props;

    if (hasError) {
      return isolate ? (
        <div className="error-boundary-isolation">
          {this.renderFallbackUI()}
        </div>
      ) : (
        this.renderFallbackUI()
      );
    }

    return children;
  }
}

export default ErrorBoundary; 