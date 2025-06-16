/**
 * Application Configuration
 *
 * Centralized configuration management with environment validation
 * and type-safe constants for the entire application.
 */

// Environment validation schema
interface EnvironmentConfig {
  NODE_ENV: "development" | "production" | "test";
  NEXT_PUBLIC_API_URL: string;
  NEXT_PUBLIC_APP_NAME: string;
  NEXT_PUBLIC_APP_VERSION: string;
}

// Runtime environment validation
const validateEnvironment = (): EnvironmentConfig => {
  const env = process.env;

  const config: EnvironmentConfig = {
    NODE_ENV: (env.NODE_ENV as EnvironmentConfig["NODE_ENV"]) || "development",
    NEXT_PUBLIC_API_URL: env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    NEXT_PUBLIC_APP_NAME: env.NEXT_PUBLIC_APP_NAME || "Web Scraping Service",
    NEXT_PUBLIC_APP_VERSION: env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
  };

  // Validation in production
  if (config.NODE_ENV === "production") {
    const requiredVars: (keyof EnvironmentConfig)[] = ["NEXT_PUBLIC_API_URL"];

    for (const variable of requiredVars) {
      if (!config[variable]) {
        throw new Error(`Missing required environment variable: ${variable}`);
      }
    }
  }

  return config;
};

// Application constants
export const APP_CONFIG = {
  // Environment variables
  ...validateEnvironment(),

  // API Configuration
  API: {
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  },

  // UI Configuration
  UI: {
    DEBOUNCE_DELAY: 300,
    ANIMATION_DURATION: 200,
    PAGINATION: {
      DEFAULT_PAGE_SIZE: 20,
      MAX_PAGE_SIZE: 100,
    },
  },

  // Feature flags
  FEATURES: {
    ENABLE_ANALYTICS: true,
    ENABLE_ERROR_REPORTING: true,
    ENABLE_PERFORMANCE_MONITORING: true,
    ENABLE_REAL_TIME_UPDATES: true,
  },

  // Application metadata
  META: {
    AUTHOR: "Development Team",
    DESCRIPTION: "Real-time product data aggregation and analysis platform",
    KEYWORDS: ["web scraping", "products", "data analysis", "dashboard"],
  },
} as const;

// Type exports for external usage
export type AppConfig = typeof APP_CONFIG;
export type ApiConfig = typeof APP_CONFIG.API;
export type UIConfig = typeof APP_CONFIG.UI;

// Utility functions
export const isDevelopment = () => APP_CONFIG.NODE_ENV === "development";
export const isProduction = () => APP_CONFIG.NODE_ENV === "production";
export const isTest = () => APP_CONFIG.NODE_ENV === "test";

// API endpoint builders
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = APP_CONFIG.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  const cleanEndpoint = endpoint.replace(/^\//, "");
  return `${baseUrl}/${cleanEndpoint}`;
};

// Debug logging utility
export const debugLog = (...args: unknown[]): void => {
  if (isDevelopment()) {
    console.log("[DEBUG]", ...args);
  }
};
