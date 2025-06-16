import React, { memo, useCallback, useMemo } from 'react';
import { Product } from '@/types/Product';

interface ProductCardProps {
  product: Product;
  onProductClick?: (product: Product) => void;
  className?: string;
  priority?: boolean;
}

/**
 * ProductCard Component
 * 
 * A performant, accessible product card with optimized rendering
 * and comprehensive error handling.
 */
const ProductCard = memo<ProductCardProps>(({ 
  product, 
  onProductClick,
  className = '',
  priority = false 
}) => {
  // Memoized formatters for better performance
  const formattedPrice = useMemo(() => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(product.price);
  }, [product.price]);

  const formattedDate = useMemo(() => {
    return new Date(product.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, [product.created_at]);

  // Optimized image error handler with useCallback
  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.src = '/placeholder-image.svg';
    target.onerror = null; // Prevent infinite error loops
  }, []);

  // Product click handler with analytics potential
  const handleProductClick = useCallback(() => {
    if (onProductClick) {
      onProductClick(product);
    }
    // TODO: Add analytics tracking here
    // analytics.track('product_card_clicked', { productId: product.id });
  }, [onProductClick, product]);

  // Keyboard navigation support
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleProductClick();
    }
  }, [handleProductClick]);

  const cardClassName = useMemo(() => {
    return `bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group cursor-pointer transform hover:-translate-y-1 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 ${className}`.trim();
  }, [className]);

  return (
    <article
      className={cardClassName}
      onClick={handleProductClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View product: ${product.title}`}
    >
      {/* Image Container with lazy loading */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={`Product image for ${product.title}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={handleImageError}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center bg-gray-200"
            role="img"
            aria-label="No image available"
          >
            <svg
              className="w-16 h-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        
        {/* Price Badge */}
        <div className="absolute top-3 right-3">
          <span 
            className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 shadow-md backdrop-blur-sm"
            aria-label={`Price: ${formattedPrice}`}
          >
            {formattedPrice}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors duration-200">
            {product.title}
          </h3>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <time 
            className="flex items-center"
            dateTime={product.created_at}
            title={`Created on ${formattedDate}`}
          >
            <svg 
              className="w-4 h-4 mr-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <span className="sr-only">Created on</span>
            {formattedDate}
          </time>
          
          <span className="flex items-center text-indigo-600">
            <svg 
              className="w-4 h-4 mr-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" 
              />
            </svg>
            <span className="sr-only">Status:</span>
            Scraped
          </span>
        </div>
      </div>

      {/* Enhanced Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </article>
  );
});

// Set display name for debugging
ProductCard.displayName = 'ProductCard';

export default ProductCard; 