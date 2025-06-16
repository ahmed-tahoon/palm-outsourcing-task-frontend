/**
 * Product Domain Types
 *
 * Comprehensive type definitions for the product domain with
 * strict type safety and validation support.
 */

// Base types for better type composition
export type ProductId = number;
export type Currency = "USD" | "EUR" | "GBP" | "CAD";
export type ProductStatus = "active" | "inactive" | "pending" | "error";

// ISO 8601 date string type for better type safety
export type ISODateString = string;

// Price with currency information
export interface Price {
  amount: number;
  currency: Currency;
  formattedValue?: string;
}

// Product metadata for tracking
export interface ProductMetadata {
  source_url?: string;
  scraping_timestamp: ISODateString;
  last_updated: ISODateString;
  scraping_method?: "manual" | "automated" | "scheduled";
  confidence_score?: number; // 0-1 scale for data quality
}

// Core Product entity
export interface Product {
  readonly id: ProductId;
  title: string;
  price: number; // Legacy: keeping for backward compatibility
  pricing?: Price; // Enhanced pricing information
  image_url: string | null;
  description?: string;
  category?: string;
  brand?: string;
  availability?: "in_stock" | "out_of_stock" | "limited" | "unknown";
  status: ProductStatus;
  metadata?: ProductMetadata;
  readonly created_at: ISODateString;
  readonly updated_at: ISODateString;
}

// API Response wrapper with better error handling
export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data: T;
  readonly message?: string;
  readonly timestamp: ISODateString;
  readonly errors?: ApiError[];
}

// Detailed error information
export interface ApiError {
  readonly code: string;
  readonly message: string;
  readonly field?: string;
  readonly details?: Record<string, unknown>;
}

// Pagination metadata
export interface PaginationMetadata {
  readonly current_page: number;
  readonly last_page: number;
  readonly per_page: number;
  readonly total: number;
  readonly has_next_page: boolean;
  readonly has_previous_page: boolean;
}

// Enhanced pagination response
export interface PaginatedResponse<T> {
  readonly data: T[];
  readonly pagination: PaginationMetadata;
  readonly filters?: ProductFilters;
  readonly sort?: SortOptions;
}

// Product filtering options
export interface ProductFilters {
  readonly category?: string[];
  readonly brand?: string[];
  readonly price_range?: {
    min: number;
    max: number;
    currency: Currency;
  };
  readonly availability?: ("in_stock" | "out_of_stock" | "limited")[];
  readonly date_range?: {
    from: ISODateString;
    to: ISODateString;
  };
  readonly search_query?: string;
}

// Sorting options
export interface SortOptions {
  readonly field: keyof Product;
  readonly direction: "asc" | "desc";
}

// Specific API response types (using composition)
export type ProductResponse = ApiResponse<Product[]>;
export type SingleProductResponse = ApiResponse<Product>;
export type PaginatedProductResponse = ApiResponse<PaginatedResponse<Product>>;

// Product creation/update DTOs
export interface CreateProductDto {
  title: string;
  price: number;
  image_url?: string | null;
  description?: string;
  category?: string;
  brand?: string;
  source_url?: string;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  readonly id: ProductId;
  status?: ProductStatus;
}

// Search and query types
export interface ProductSearchParams {
  query?: string;
  filters?: ProductFilters;
  sort?: SortOptions;
  page?: number;
  per_page?: number;
}

// Analytics and reporting types
export interface ProductAnalytics {
  total_products: number;
  average_price: Price;
  price_distribution: Record<string, number>;
  category_breakdown: Record<string, number>;
  status_breakdown: Record<ProductStatus, number>;
  scraping_success_rate: number;
}

// Type guards for runtime type checking
export const isProduct = (obj: unknown): obj is Product => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    "title" in obj &&
    "price" in obj &&
    "created_at" in obj &&
    "updated_at" in obj
  );
};

export const isProductArray = (obj: unknown): obj is Product[] => {
  return Array.isArray(obj) && obj.every(isProduct);
};

export const isApiResponse = <T>(obj: unknown): obj is ApiResponse<T> => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "success" in obj &&
    "data" in obj &&
    "timestamp" in obj
  );
};

// Utility types for component props
export type ProductCardVariant = "default" | "compact" | "detailed";
export type ProductListLayout = "grid" | "list" | "table";

// Hook return types for better type inference
export interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  pagination: PaginationMetadata | null;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
}

export interface UseProductReturn {
  product: Product | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  update: (updates: UpdateProductDto) => Promise<void>;
}

// Export all types for easy consumption
export type {
  Product,
  ProductId,
  Currency,
  ProductStatus,
  ISODateString,
  Price,
  ProductMetadata,
  ApiResponse,
  ApiError,
  PaginationMetadata,
  PaginatedResponse,
  ProductFilters,
  SortOptions,
  ProductResponse,
  SingleProductResponse,
  PaginatedProductResponse,
  CreateProductDto,
  UpdateProductDto,
  ProductSearchParams,
  ProductAnalytics,
  ProductCardVariant,
  ProductListLayout,
  UseProductsReturn,
  UseProductReturn,
};
