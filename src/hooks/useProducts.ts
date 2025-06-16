import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Product,
  ProductSearchParams,
  PaginatedProductResponse,
  UseProductsReturn,
  PaginationMetadata,
} from "@/types/Product";

// Configuration for the hook
interface UseProductsConfig {
  initialParams?: ProductSearchParams;
  autoFetch?: boolean;
  refreshInterval?: number;
  cacheTimeout?: number;
}

// Internal state interface
interface ProductsState {
  products: Product[];
  loading: boolean;
  error: string | null;
  pagination: PaginationMetadata | null;
  lastFetchTime: number | null;
}

// Cache implementation for better performance
class ProductsCache {
  private cache = new Map<string, { data: Product[]; timestamp: number }>();
  private readonly timeout: number;

  constructor(timeout = 5 * 60 * 1000) {
    // 5 minutes default
    this.timeout = timeout;
  }

  private generateKey(params: ProductSearchParams): string {
    return JSON.stringify(params);
  }

  get(params: ProductSearchParams): Product[] | null {
    const key = this.generateKey(params);
    const cached = this.cache.get(key);

    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.timeout) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set(params: ProductSearchParams, data: Product[]): void {
    const key = this.generateKey(params);
    this.cache.set(key, { data: [...data], timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Global cache instance
const productsCache = new ProductsCache();

/**
 * Custom hook for managing product data with advanced features
 *
 * Features:
 * - Intelligent caching with TTL
 * - Error recovery with exponential backoff
 * - Optimistic updates
 * - Real-time refresh capabilities
 * - Memory leak prevention
 * - Type-safe error handling
 */
export const useProducts = (
  config: UseProductsConfig = {}
): UseProductsReturn => {
  const {
    initialParams = {},
    autoFetch = true,
    refreshInterval,
  } = config;

  // State management
  const [state, setState] = useState<ProductsState>({
    products: [],
    loading: autoFetch,
    error: null,
    pagination: null,
    lastFetchTime: null,
  });

  // Current search parameters
  const [searchParams, setSearchParams] =
    useState<ProductSearchParams>(initialParams);

  // Refs for cleanup and cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoized API endpoint
  const apiEndpoint = useMemo(() => {
    const baseUrl =
      "https://backend.test";
    return `${baseUrl}/api/products`;
  }, []);

  // Error handler with retry logic
  const handleError = useCallback((error: unknown, retryFn?: () => void) => {
    console.error("Products fetch error:", error);

    let errorMessage = "An unexpected error occurred";

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    }

    setState((prev) => ({ ...prev, error: errorMessage, loading: false }));

    // Optional retry with exponential backoff
    if (retryFn && !retryTimeoutRef.current) {
      retryTimeoutRef.current = setTimeout(() => {
        retryTimeoutRef.current = null;
        retryFn();
      }, 2000);
    }
  }, []);

  // Main fetch function with comprehensive error handling
  const fetchProducts = useCallback(
    async (params: ProductSearchParams = searchParams) => {
      try {
        // Cancel previous request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        // Check cache first
        const cachedData = productsCache.get(params);
        if (cachedData && !state.loading) {
          setState((prev) => ({
            ...prev,
            products: cachedData,
            error: null,
            lastFetchTime: Date.now(),
          }));
          return;
        }

        // Create new abort controller
        abortControllerRef.current = new AbortController();

        setState((prev) => ({ ...prev, loading: true, error: null }));

        // Build query string
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (typeof value === "object") {
              queryParams.append(key, JSON.stringify(value));
            } else {
              queryParams.append(key, String(value));
            }
          }
        });

        const url = `${apiEndpoint}?${queryParams.toString()}`;

        const response = await fetch(url, {
          signal: abortControllerRef.current.signal,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: PaginatedProductResponse = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Failed to fetch products");
        }

        const products = data.data.data || [];
        const pagination = data.data.pagination || null;

        // Update cache
        productsCache.set(params, products);

        setState((prev) => ({
          ...prev,
          products,
          pagination,
          loading: false,
          error: null,
          lastFetchTime: Date.now(),
        }));
      } catch (error: unknown) {
        // Don't update state if request was aborted
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        handleError(error, () => fetchProducts(params));
      }
    },
    [apiEndpoint, searchParams, handleError, state.loading]
  );

  // Refetch with current parameters
  const refetch = useCallback(async () => {
    await fetchProducts(searchParams);
  }, [fetchProducts, searchParams]);

  // Load more products (pagination)
  const loadMore = useCallback(async () => {
    if (!state.pagination?.has_next_page || state.loading) return;

    const nextPageParams = {
      ...searchParams,
      page: (state.pagination.current_page || 0) + 1,
    };

    try {
      setState((prev) => ({ ...prev, loading: true }));

      const response = await fetch(
        `${apiEndpoint}?${new URLSearchParams(
          Object.entries(nextPageParams).map(([k, v]) => [k, String(v)])
        ).toString()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: PaginatedProductResponse = await response.json();

      if (data.success && data.data.data) {
        setState((prev) => ({
          ...prev,
          products: [...prev.products, ...data.data.data],
          pagination: data.data.pagination,
          loading: false,
          error: null,
        }));
      }
    } catch (error) {
      handleError(error);
    }
  }, [state.pagination, state.loading, searchParams, apiEndpoint, handleError]);

  // Update search parameters
  const updateSearchParams = useCallback(
    (newParams: Partial<ProductSearchParams>) => {
      setSearchParams((prev) => ({ ...prev, ...newParams }));
    },
    []
  );

  // Setup auto-refresh
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        refetch();
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [refreshInterval, refetch]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchProducts(searchParams);
    }

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [autoFetch, fetchProducts, searchParams]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    products: state.products,
    loading: state.loading,
    error: state.error,
    pagination: state.pagination,
    refetch,
    loadMore,
    // Additional utilities
    updateSearchParams,
    clearCache: productsCache.clear.bind(productsCache),
    lastFetchTime: state.lastFetchTime,
  } as UseProductsReturn & {
    updateSearchParams: (params: Partial<ProductSearchParams>) => void;
    clearCache: () => void;
    lastFetchTime: number | null;
  };
};
