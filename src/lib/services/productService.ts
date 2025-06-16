import { Product, ApiResponse } from "@/types/Product";

const API_BASE_URL = "https://backend.test";

// Add scrape response interface
export interface ScrapeResponse {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
}

export class ProductService {
  private static instance: ProductService;

  static getInstance(): ProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService();
    }
    return ProductService.instance;
  }

  async fetchProducts(): Promise<ApiResponse<Product[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to fetch products"
      );
    }
  }

  async fetchProductById(id: number): Promise<ApiResponse<Product>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to fetch product"
      );
    }
  }

  async scrapeUrl(url: string): Promise<ScrapeResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`
        );
      }

      return data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to scrape URL"
      );
    }
  }
}

// Export singleton instance
export const productService = ProductService.getInstance();
