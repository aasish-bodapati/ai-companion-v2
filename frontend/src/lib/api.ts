/**
 * API Client with JWT Authentication
 * 
 * A wrapper around fetch that handles JWT tokens, error handling,
 * and request/response transformation.
 */

// CSRF not needed - backend uses JWT authentication

// Ensure API base URL includes version prefix `/api/v1` by default
const RAW_API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const API_PREFIX = '/api/v1';
const API_BASE_URL = RAW_API_BASE.endsWith(API_PREFIX) ? RAW_API_BASE : `${RAW_API_BASE}${API_PREFIX}`;

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: any;
  params?: Record<string, any>;
  // Optional per-request timeout override (ms)
  timeoutMs?: number;
  // Optional idempotency key for duplicate request prevention
  idempotencyKey?: string;
  // Optional request ID for tracking
  requestId?: string;
};

/**
 * Enhanced fetch with JSON handling and error management
 */
async function apiFetch<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  // Helper to deeply redact common token fields before logging
  const redactPayload = (value: any): any => {
    const redactKeys = new Set(['access_token', 'refresh_token', 'token', 'id_token', 'authorization']);
    const helper = (v: any): any => {
      if (v === null || v === undefined) return v;
      if (Array.isArray(v)) return v.map(helper);
      if (typeof v === 'object') {
        const out: any = {};
        for (const [k, val] of Object.entries(v)) {
          out[k] = redactKeys.has(k) ? '[REDACTED]' : helper(val);
        }
        return out;
      }
      return v;
    };
    return helper(value);
  };
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  
  // Add query parameters if provided
  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  
  // Set up headers
  const headers = new Headers(options.headers);
  
  // Set content type for requests with body
  if (options.body && !(options.body instanceof FormData)) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }
  
  // Add idempotency key if provided
  if (options.idempotencyKey && !headers.has('Idempotency-Key')) {
    headers.set('Idempotency-Key', options.idempotencyKey);
  }
  
  // Add request ID for tracking if provided
  if (options.requestId && !headers.has('X-Request-ID')) {
    headers.set('X-Request-ID', options.requestId);
  }
  
    // Add authorization token if available, except for public auth endpoints
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const isPublicAuthEndpoint = endpoint === '/login/access-token' || endpoint === '/register';

  // Debug logging removed for production security

  if (token && !headers.has('Authorization') && !isPublicAuthEndpoint) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Compose abort signals to support both caller-provided signal and timeout
  const controller = new AbortController();
  const { signal: callerSignal, timeoutMs } = options as { signal?: AbortSignal; timeoutMs?: number };
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  if (callerSignal) {
    if (callerSignal.aborted) controller.abort();
    else callerSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }
  if (typeof timeoutMs === 'number' && timeoutMs > 0) {
    timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);
  }

  // Prepare request config
  const config: RequestInit = {
    ...options,
    signal: controller.signal,
    headers,
    // Avoid cross-site cookies; we use Bearer tokens instead
    credentials: 'omit',
  };
  
  // Backend uses JWT authentication, not CSRF tokens, so no CSRF setup needed
  
  // Handle request body correctly based on type and Content-Type
  if (options.body !== undefined) {
    const contentType = headers.get('Content-Type') || '';
    if (options.body instanceof FormData) {
      config.body = options.body;
    } else if (typeof options.body === 'string') {
      // Caller provided raw string (e.g., x-www-form-urlencoded)
      config.body = options.body;
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      // Allow passing URLSearchParams or plain object for form-encoded
      if (options.body instanceof URLSearchParams) {
        config.body = options.body.toString();
      } else {
        const params = new URLSearchParams();
        Object.entries(options.body).forEach(([k, v]) => {
          if (v !== undefined && v !== null) params.append(k, String(v));
        });
        config.body = params.toString();
      }
    } else {
      // Default to JSON
      config.body = JSON.stringify(options.body);
    }
  }
  
  // Make the request with better network error visibility
  let response: Response;
  try {
    // Dev debug: log outgoing requests (removed for production)
    // Logging removed to improve performance and reduce bundle size

    // Use plain fetch instead of fetchWithCSRF since backend uses JWT auth, not CSRF
    
    // Debug logging removed for production security
    
    response = await fetch(url.toString(), config);
    
    // Debug logging removed for production security
  } catch (err: any) {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    const isAbort = err?.name === 'AbortError' || err?.message?.includes('aborted');
    const m = isAbort ? 'Request aborted' : 'Request failed';
    const u = url.toString();
    // Production-safe error logging
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[API] Network error: ${m} ${u}`);
      console.error(err);
    }
    // Provide a clearer message if this was due to our timeout
    if (isAbort && typeof timeoutMs === 'number' && timeoutMs > 0) {
      const e = new Error(`Request timed out after ${timeoutMs} ms`);
      (e as any).cause = err;
      throw e;
    }
    throw err;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  }
  
  // Attempt to parse body safely: read text once, parse JSON only if non-empty
  const contentType = response.headers.get('content-type');
  const isJson = !!contentType && contentType.includes('application/json');
  let textBody: string | null = null;
  let payload: any = null;
  if (response.status !== 204 && response.status !== 205) {
    try {
      textBody = await response.text();
      // Debug logging removed for production security
    } catch (_) {
      textBody = null;
      console.log('🔍 Failed to read response body for:', url.toString());
    }
    if (isJson && textBody && textBody.trim().length > 0) {
      try {
        payload = JSON.parse(textBody);
        // Debug logging removed for production security
      } catch (_) {
        payload = null;
        console.log('🔍 Failed to parse JSON for:', url.toString());
      }
    }
  }

  // Emit rate limit event for tracking
  if (typeof window !== 'undefined') {
    const rateLimitEvent = new CustomEvent('rateLimitUpdate', {
      detail: {
        remaining: response.headers.get('X-RateLimit-Remaining'),
        limit: response.headers.get('X-RateLimit-Limit'),
        reset: response.headers.get('X-RateLimit-Reset'),
      }
    });
    window.dispatchEvent(rateLimitEvent);
  }

  if (!response.ok) {
    // Prefer server-provided detail/message
    const serverMsg = payload?.detail || payload?.message;
    let msg = serverMsg || `Request failed with status ${response.status}`;

    // Fallback: use already-read text body when available
    if (!serverMsg && textBody && textBody.trim().length > 0) {
      msg = textBody;
    }
    
    // Debug logging removed for production security

    // Handle auth failure globally: clear token and redirect to login
    if ((response.status === 401 || response.status === 403) && typeof window !== 'undefined') {
      try {
        localStorage.removeItem('token');
      } catch (_) {
        // ignore
      }
      // Avoid redirect loop if already on login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    const error = new Error(msg);
    (error as any).status = response.status;
    (error as any).data = payload;
    throw error;
  }
  
  return (payload as T);
}

/**
 * HTTP GET request
 */
export function get<T = any>(
  endpoint: string,
  params?: Record<string, any>,
  options: Omit<RequestOptions, 'body' | 'method'> = {}
): Promise<T> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: 'GET',
    params,
  });
}

/**
 * HTTP POST request
 */
export function post<T = any>(
  endpoint: string,
  body?: any,
  options: Omit<RequestOptions, 'body' | 'method'> = {}
): Promise<T> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: 'POST',
    body,
  });
}

/**
 * HTTP POST request that returns a raw streaming Response (no JSON parsing)
 */
export async function postStreamRaw(
  endpoint: string,
  body?: any,
  options: Omit<RequestOptions, 'body' | 'method'> = {}
): Promise<Response> {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  // Hint server we expect SSE stream and avoid caches/proxies buffering
  if (!headers.has('Accept')) headers.set('Accept', 'text/event-stream');
  if (!headers.has('Cache-Control')) headers.set('Cache-Control', 'no-cache');
  if (!headers.has('Connection')) headers.set('Connection', 'keep-alive');
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);

  // Optional timeout support for initiating streaming requests; many streams should not timeout,
  // so only apply if caller explicitly passes timeoutMs.
  const controller = new AbortController();
  const { signal: callerSignal, timeoutMs } = options as { signal?: AbortSignal; timeoutMs?: number };
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  if (callerSignal) {
    if (callerSignal.aborted) controller.abort();
    else callerSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }
  if (typeof timeoutMs === 'number' && timeoutMs > 0) {
    timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  }

  // Debug logging removed for production security

  const response = await fetch(url.toString(), {
    ...options,
    signal: controller.signal,
    method: 'POST',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'omit',
  }).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
  // Debug logging removed for production security
  if (!response.ok) {
    throw new Error(`Streaming request failed: ${response.status}`);
  }
  return response;
}

/**
 * HTTP PUT request
 */
export function put<T = any>(
  endpoint: string,
  body?: any,
  options: Omit<RequestOptions, 'body' | 'method'> = {}
): Promise<T> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: 'PUT',
    body,
  });
}

/**
 * HTTP PATCH request
 */
export function patch<T = any>(
  endpoint: string,
  body?: any,
  options: Omit<RequestOptions, 'body' | 'method'> = {}
): Promise<T> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body,
  });
}

/**
 * HTTP DELETE request
 */
export function del<T = any>(
  endpoint: string,
  options: Omit<RequestOptions, 'method'> = {}
): Promise<T> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: 'DELETE',
  });
}

// Export the API client
export const api = {
  get,
  post,
  postStreamRaw,
  put,
  patch,
  delete: del,
};

export default api;
