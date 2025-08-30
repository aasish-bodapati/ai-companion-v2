/**
 * CSRF Token Utilities
 * 
 * This module provides functions to work with CSRF tokens in the frontend.
 * It handles storing, retrieving, and validating CSRF tokens.
 */

import logger from '@/utils/logger';

export const CSRF_TOKEN_COOKIE = 'csrftoken';
export const CSRF_HEADER = 'X-CSRF-Token';

/**
 * Get the CSRF token from cookies
 */
export function getCSRFToken(): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${CSRF_TOKEN_COOKIE}=([^;]+)`));
  return match ? match[2] : null;
}

/**
 * Set the CSRF token in cookies
 */
export function setCSRFToken(token: string, maxAge: number = 86400): void {
  const secure = window.location.protocol === 'https:';
  document.cookie = `${CSRF_TOKEN_COOKIE}=${token}; Path=/; Max-Age=${maxAge}; ${secure ? 'Secure; ' : ''}SameSite=Lax`;
}

/**
 * Add CSRF token to fetch headers
 */
export function withCSRFToken(headers: HeadersInit = {}): HeadersInit {
  const token = getCSRFToken();
  if (!token) return headers;
  
  // If a Headers instance is provided, mutate it to preserve existing headers
  if (typeof Headers !== 'undefined' && headers instanceof Headers) {
    const h = headers as Headers;
    h.set(CSRF_HEADER, token);
    return h;
  }

  // Otherwise, treat as a plain object or array of tuples
  if (Array.isArray(headers)) {
    return [...headers, [CSRF_HEADER, token]] as HeadersInit;
  }
  
  return {
    ...(headers as Record<string, string>),
    [CSRF_HEADER]: token,
  } as HeadersInit;
}

/**
 * Enhanced fetch with CSRF protection
 */
export async function fetchWithCSRF(
  input: RequestInfo,
  init: RequestInit = {}
): Promise<Response> {
  // Add CSRF token to headers for non-GET requests, but only for same-origin
  if (typeof window !== 'undefined' && init.method && !['GET', 'HEAD', 'OPTIONS'].includes(init.method.toUpperCase())) {
    try {
      const requestUrl = typeof input === 'string' ? input : (input as Request).url;
      const reqOrigin = new URL(requestUrl, window.location.href).origin;
      const sameOrigin = reqOrigin === window.location.origin;
      if (sameOrigin) {
        init.headers = withCSRFToken(init.headers);
      }
    } catch (_) {
      // If URL parsing fails, skip CSRF header to be safe
    }
  }
  
  const response = await fetch(input, init);
  
  // If we get a 403 and it's a CSRF error, handle it
  if (response.status === 403) {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      if (data.detail?.includes('CSRF')) {
        // Handle CSRF error (e.g., redirect to login or show a message)
        logger.error('CSRF validation failed', data.detail);
        // You might want to redirect to login or refresh the page
        // window.location.reload();
      }
    }
  }
  
  return response;
}

/**
 * Get CSRF token from meta tags (for server-side rendering)
 */
export function getCSRFTokenFromMeta(): string | null {
  if (typeof document === 'undefined') return null;
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta ? meta.getAttribute('content') : null;
}

/**
 * Initialize CSRF token from meta tags if available
 */
export function initializeCSRFToken(): void {
  if (typeof document === 'undefined') return;
  
  const token = getCSRFTokenFromMeta();
  if (token) {
    setCSRFToken(token);
  }
}

// Initialize CSRF token when this module is loaded
if (typeof window !== 'undefined') {
  initializeCSRFToken();
}
