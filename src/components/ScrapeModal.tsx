import React, { useState, useCallback } from 'react';
import { productService, ScrapeResponse } from '@/lib/services/productService';

interface ScrapeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * ScrapeModal Component
 * 
 * A modal component for URL scraping with form validation,
 * loading states, and error handling.
 */
const ScrapeModal: React.FC<ScrapeModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Reset modal state when opening
  const resetState = useCallback(() => {
    setUrl('');
    setError(null);
    setSuccess(null);
    setLoading(false);
  }, []);

  // Handle modal close
  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  // URL validation
  const isValidUrl = useCallback((urlString: string): boolean => {
    try {
      const urlObj = new URL(urlString);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!isValidUrl(url.trim())) {
      setError('Please enter a valid URL (must start with http:// or https://)');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response: ScrapeResponse = await productService.scrapeUrl(url.trim());
      
      if (response.success) {
        setSuccess(response.message);
        setUrl('');
        onSuccess?.();
      } else {
        setError(response.message || 'Failed to scrape the URL');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [url, isValidUrl, onSuccess]);

  // Handle URL input change
  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    // Clear previous errors when user starts typing
    if (error) setError(null);
    if (success) setSuccess(null);
  }, [error, success]);

  // Keyboard navigation for modal
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  }, [handleClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="scrape-modal-title"
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 
            id="scrape-modal-title"
            className="text-xl font-semibold text-gray-900"
          >
            Scrape Product
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
            aria-label="Close modal"
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label 
              htmlFor="url-input"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Product URL
            </label>
            <input
              id="url-input"
              type="url"
              value={url}
              onChange={handleUrlChange}
              placeholder="https://example.com/product/123"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400"
              disabled={loading}
              autoFocus
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex">
                <svg 
                  className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <div className="flex">
                <svg 
                  className="w-5 h-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg 
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Scraping...
                </>
              ) : (
                'Scrape Product'
              )}
            </button>
          </div>
        </form>

        {/* Help Text */}
        <div className="mt-4 text-xs text-gray-500">
          <p>Enter a product URL from supported e-commerce sites to extract product information.</p>
        </div>
      </div>
    </div>
  );
};

export default ScrapeModal; 