import { useState, useEffect, useCallback } from "react";
import { Product } from "@/types/Product";
import { productService } from "@/lib/services/productService";

interface UseProductsPageReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
}

export const useProductsPage = (
  autoRefreshInterval = 30000
): UseProductsPageReturn => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setError(null);
      const response = await productService.fetchProducts();

      if (response.success) {
        setProducts(response.data);
        setLastUpdated(new Date());
      } else {
        throw new Error(response.message || "Failed to fetch products");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    // Initial fetch
    fetchProducts();

    // Set up auto-refresh
    const interval = setInterval(() => {
      fetchProducts();
    }, autoRefreshInterval);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [fetchProducts, autoRefreshInterval]);

  return {
    products,
    loading,
    error,
    lastUpdated,
    refresh,
  };
};
