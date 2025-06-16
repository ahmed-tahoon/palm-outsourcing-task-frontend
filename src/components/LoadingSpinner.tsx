import React, { memo, useMemo } from 'react';

type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  text?: string;
  variant?: 'primary' | 'secondary' | 'minimal';
  className?: string;
  'aria-label'?: string;
}

interface SpinnerConfig {
  spinnerSize: string;
  textSize: string;
  dotSize: string;
  spacing: string;
}

/**
 * LoadingSpinner Component
 * 
 * A flexible, accessible loading spinner with multiple variants
 * and optimized performance through memoization.
 */
const LoadingSpinner = memo<LoadingSpinnerProps>(({ 
  size = 'md', 
  text = 'Loading products...',
  variant = 'primary',
  className = '',
  'aria-label': ariaLabel
}) => {
  // Memoized size configuration for better performance
  const sizeConfig = useMemo((): SpinnerConfig => {
    const configs: Record<SpinnerSize, SpinnerConfig> = {
      sm: {
        spinnerSize: 'w-4 h-4',
        textSize: 'text-sm',
        dotSize: 'w-1 h-1',
        spacing: 'space-y-2'
      },
      md: {
        spinnerSize: 'w-8 h-8',
        textSize: 'text-base',
        dotSize: 'w-2 h-2',
        spacing: 'space-y-3'
      },
      lg: {
        spinnerSize: 'w-12 h-12',
        textSize: 'text-lg',
        dotSize: 'w-2.5 h-2.5',
        spacing: 'space-y-4'
      },
      xl: {
        spinnerSize: 'w-16 h-16',
        textSize: 'text-xl',
        dotSize: 'w-3 h-3',
        spacing: 'space-y-5'
      }
    };
    return configs[size];
  }, [size]);

  // Memoized variant styles
  const variantStyles = useMemo(() => {
    const variants = {
      primary: {
        spinner: 'border-gray-200 border-t-indigo-600',
        ping: 'border-indigo-300',
        text: 'text-gray-700',
        dots: 'bg-indigo-500'
      },
      secondary: {
        spinner: 'border-gray-200 border-t-gray-600',
        ping: 'border-gray-300',
        text: 'text-gray-600',
        dots: 'bg-gray-500'
      },
      minimal: {
        spinner: 'border-gray-100 border-t-gray-400',
        ping: 'border-gray-200',
        text: 'text-gray-500',
        dots: 'bg-gray-400'
      }
    };
    return variants[variant];
  }, [variant]);

  // Memoized container classes
  const containerClasses = useMemo(() => {
    return `flex flex-col items-center justify-center ${sizeConfig.spacing} ${className}`.trim();
  }, [sizeConfig.spacing, className]);

  return (
    <div 
      className={containerClasses}
      role="status"
      aria-live="polite"
      aria-label={ariaLabel || text || 'Loading content'}
    >
      {/* Spinner Container */}
      <div className="relative" aria-hidden="true">
        {/* Main spinning circle */}
        <div 
          className={`
            ${sizeConfig.spinnerSize} 
            animate-spin 
            rounded-full 
            border-4 
            ${variantStyles.spinner}
          `}
        />
        
        {/* Ping effect overlay */}
        <div 
          className={`
            ${sizeConfig.spinnerSize} 
            absolute 
            top-0 
            left-0 
            animate-ping 
            rounded-full 
            border-4 
            ${variantStyles.ping} 
            opacity-30
          `}
        />
      </div>
      
      {/* Loading text with animated dots */}
      {text && (
        <div className="flex items-center space-x-2">
          <span 
            className={`${variantStyles.text} font-medium ${sizeConfig.textSize}`}
            aria-hidden="true"
          >
            {text}
          </span>
          
          {/* Animated dots */}
          <div className="flex space-x-1" aria-hidden="true">
            <div 
              className={`
                ${sizeConfig.dotSize} 
                ${variantStyles.dots} 
                rounded-full 
                animate-bounce
              `}
              style={{ animationDelay: '0ms' }}
            />
            <div 
              className={`
                ${sizeConfig.dotSize} 
                ${variantStyles.dots} 
                rounded-full 
                animate-bounce
              `}
              style={{ animationDelay: '150ms' }}
            />
            <div 
              className={`
                ${sizeConfig.dotSize} 
                ${variantStyles.dots} 
                rounded-full 
                animate-bounce
              `}
              style={{ animationDelay: '300ms' }}
            />
          </div>
        </div>
      )}
      
      {/* Screen reader only text */}
      <span className="sr-only">
        {ariaLabel || text || 'Loading content, please wait'}
      </span>
    </div>
  );
});

// Set display name for debugging
LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner; 