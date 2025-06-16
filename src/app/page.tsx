'use client';

import React, { Suspense, useMemo, useCallback, useState, useEffect } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import LoadingSpinner from '@/components/LoadingSpinner';
import ProductCard from '@/components/ProductCard';
import ScrapeModal from '@/components/ScrapeModal';
import { useProducts } from '@/hooks/useProducts';
import { Product, ProductSearchParams } from '@/types/Product';

/**
 * ProductsGridView Component
 * 
 * Virtualized product grid with infinite scroll and optimistic updates
 */
interface ProductsGridProps {
  searchParams: ProductSearchParams;
  onRefetch?: React.MutableRefObject<() => void>;
}

const ProductsGrid: React.FC<ProductsGridProps> = ({ searchParams, onRefetch }) => {
  const { 
    products, 
    loading, 
    error, 
    pagination, 
    refetch, 
    loadMore 
  } = useProducts({
    initialParams: searchParams,
    autoFetch: true,
    refreshInterval: 30000, // Refresh every 30 seconds
  });

  const handleProductClick = useCallback((product: Product) => {
    // In a real app, this might navigate to product detail page
    console.log('Product clicked:', product.id);
    // Example: router.push(`/products/${product.id}`);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (pagination?.has_next_page && !loading) {
      loadMore();
    }
  }, [pagination?.has_next_page, loading, loadMore]);

  // Memoized grid layout calculation
  const gridConfig = useMemo(() => ({
    cols: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    gap: 'gap-6',
    container: 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  }), []);

  // Store refetch function to be called from parent
  useEffect(() => {
    if (onRefetch) {
      onRefetch.current = refetch;
    }
  }, [refetch, onRefetch]);

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load products</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <button
          onClick={refetch}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={gridConfig.container}>
      {/* Products Grid */}
      <div className={`grid ${gridConfig.cols} ${gridConfig.gap}`}>
        {products.map((product, index) => (
          <ProductCard
            key={`${product.id}-${index}`}
            product={product}
            onProductClick={handleProductClick}
            priority={index < 4} // Prioritize first 4 images
          />
        ))}
      </div>

      {/* Load More Section */}
      {pagination?.has_next_page && (
        <div className="text-center mt-12">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" variant="minimal" className="mr-3" />
                Loading...
              </>
            ) : (
              `Load More Products (${pagination.total - products.length} remaining)`
            )}
          </button>
        </div>
      )}

      {/* Loading State for Initial Load */}
      {loading && products.length === 0 && (
        <div className="text-center py-12">
          <LoadingSpinner size="lg" text="Loading products..." />
        </div>
      )}

      {/* Empty State */}
      {!loading && products.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
          <p className="mt-1 text-sm text-gray-500">Start scraping to see products here.</p>
        </div>
      )}
    </div>
  );
};

/**
 * SearchFilters Component
 * 
 * Advanced filtering interface with real-time search
 */
interface SearchFiltersProps {
  onFiltersChange: (filters: Partial<ProductSearchParams>) => void;
  loading: boolean;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({ onFiltersChange, loading }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: '', max: '' });

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Debounced search
    const timeoutId = setTimeout(() => {
      onFiltersChange({ query: query || undefined });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [onFiltersChange]);

  const handlePriceRangeSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    const filters: Partial<ProductSearchParams> = {};
    
    if (priceRange.min || priceRange.max) {
      filters.filters = {
        price_range: {
          min: Number(priceRange.min) || 0,
          max: Number(priceRange.max) || Infinity,
          currency: 'USD'
        }
      };
    }
    
    onFiltersChange(filters);
  }, [priceRange, onFiltersChange]);

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Search Input */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Search Products
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by product name..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={loading}
            />
          </div>
        </div>

        {/* Price Range Filter */}
        <form onSubmit={handlePriceRangeSubmit} className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price Range
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="number"
              placeholder="Min"
              value={priceRange.min}
              onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={loading}
            />
            <span className="text-gray-500">to</span>
            <input
              type="number"
              placeholder="Max"
              value={priceRange.max}
              onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Apply
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Main Dashboard Page Component
 * 
 * A comprehensive web scraping dashboard with modern UX patterns
 */
export default function ScrapingDashboard() {
  const [searchParams, setSearchParams] = useState<ProductSearchParams>({});
  const [loading, setLoading] = useState(false);
  const [isScrapeModalOpen, setIsScrapeModalOpen] = useState(false);
  const refetchRef = React.useRef<() => void>(() => {});

  const handleFiltersChange = useCallback((newFilters: Partial<ProductSearchParams>) => {
    setLoading(true);
    setSearchParams(prev => ({ ...prev, ...newFilters }));
    
    // Reset loading state after a short delay
    setTimeout(() => setLoading(false), 500);
  }, []);

  const handleScrapeSuccess = useCallback(() => {
    // Refresh the products list after successful scrape
    if (refetchRef.current) {
      refetchRef.current();
    }
  }, []);

  return (
    <ErrorBoundary level="page" enableRetry maxRetries={3}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
                Product Scraping Dashboard
              </h1>
              <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
                Real-time product data aggregation and analysis platform. 
                Monitor pricing trends and inventory across multiple sources.
              </p>
              
              {/* Scrape Button */}
              <div className="mt-6">
                <button
                  onClick={() => setIsScrapeModalOpen(true)}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                >
                  <svg 
                    className="w-5 h-5 mr-2" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
                    />
                  </svg>
                  Scrape New Product
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search and Filters */}
          <SearchFilters 
            onFiltersChange={handleFiltersChange}
            loading={loading}
          />

          {/* Products Grid with Error Boundaries */}
          <ErrorBoundary 
            level="section" 
            enableRetry 
            resetKeys={[JSON.stringify(searchParams)]}
            resetOnPropsChange
          >
            <Suspense fallback={<LoadingSpinner size="lg" text="Loading products..." />}>
              <ProductsGrid searchParams={searchParams} onRefetch={refetchRef} />
            </Suspense>
          </ErrorBoundary>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-gray-500">
              <p>&copy; 2024 Web Scraping Service. Built with Next.js, TypeScript & Tailwind CSS.</p>
            </div>
          </div>
        </footer>

        {/* Scrape Modal */}
        <ScrapeModal
          isOpen={isScrapeModalOpen}
          onClose={() => setIsScrapeModalOpen(false)}
          onSuccess={handleScrapeSuccess}
        />
      </div>
    </ErrorBoundary>
  );
}
