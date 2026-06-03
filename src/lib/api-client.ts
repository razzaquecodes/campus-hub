import { Platform } from 'react-native';

/**
 * api-client.ts
 *
 * Global HTTP client wrapper for Campus Hub.
 * Features:
 * - Timeout handling
 * - Exponential backoff retries
 * - Error normalization
 * - Debug logging for networking
 */

interface ApiClientOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}

class ApiError extends Error {
  public status?: number;
  public data?: unknown;

  constructor(message: string, status?: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function fetchWithRetry(url: string, options: ApiClientOptions = {}): Promise<Response> {
  const {
    timeoutMs = 15000,
    retries = 2,
    retryDelayMs = 1000,
    ...fetchOptions
  } = options;

  let attempt = 0;

  if (__DEV__) {
    console.log('\n[API REQUEST]');
    console.log('Platform  :', Platform.OS);
    console.log('Final URL :', url);
  }

  while (attempt <= retries) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal as AbortSignal,
      });

      clearTimeout(id);

      if (__DEV__) {
        console.log(`Status    : ${response.status} (${response.ok ? 'OK' : 'ERROR'})`);
      }

      if (!response.ok) {
        throw new ApiError(`HTTP Error: ${response.status}`, response.status);
      }

      return response;
    } catch (error: any) {
      const isAbortError = error instanceof Error && error.name === 'AbortError';
      const isRetryable = isAbortError || (error instanceof ApiError && error.status && error.status >= 500);

      if (__DEV__) {
        console.warn(`[API ERROR] Attempt ${attempt + 1}/${retries + 1} failed: ${error.message}`);
      }

      if (attempt >= retries || !isRetryable) {
        if (isAbortError) {
          throw new ApiError('Request timed out', 408);
        }
        throw error;
      }

      attempt++;
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs * attempt));
    }
  }

  throw new ApiError('Request failed');
}

export const apiClient = {
  async get<T = unknown>(url: string, options?: ApiClientOptions): Promise<T> {
    const response = await fetchWithRetry(url, { ...options, method: 'GET' });
    const text = await response.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  },

  async post<T = unknown>(url: string, body?: unknown, options?: ApiClientOptions): Promise<T> {
    const response = await fetchWithRetry(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  },
};
