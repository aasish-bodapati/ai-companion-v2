export type MappedError = {
  status?: number;
  code?: string;
  message: string;
  fieldErrors?: Array<{ loc?: any; msg?: string; type?: string }> | null;
  raw?: unknown;
};

// Maps API errors thrown from api.ts (Error with .status and .data) to a user-friendly shape
export function mapApiError(err: any): MappedError {
  const status: number | undefined = err?.status ?? (typeof err?.statusCode === 'number' ? err.statusCode : undefined);
  const data = err?.data ?? err;
  const backendMsg = data?.message || data?.detail;
  const errors = data?.errors ?? null;

  // Default message fallbacks
  let message = backendMsg || err?.message || 'Something went wrong';

  // Specialize common cases
  switch (status) {
    case 401:
    case 403:
      message = backendMsg || 'Please sign in to continue';
      break;
    case 404:
      message = backendMsg || 'Not found';
      break;
    case 422:
      if (errors && Array.isArray(errors) && errors.length > 0) {
        // Use first field error for brevity
        const first = errors[0];
        const loc = Array.isArray(first?.loc) ? first.loc.filter(Boolean).join('.') : undefined;
        message = first?.msg ? (loc ? `${first.msg} (${loc})` : first.msg) : 'Validation error';
      } else {
        message = backendMsg || 'Validation error';
      }
      break;
    case 500:
      message = backendMsg || 'Server error. Please try again later';
      break;
    default:
      // Network/timeout or unknown
      if (!status) {
        if (err?.name === 'AbortError' || /timed out/i.test(String(err?.message))) {
          message = 'The request timed out. Please retry.';
        } else if (/NetworkError|Failed to fetch|Network request failed/i.test(String(err?.message))) {
          message = 'Network error. Check your connection and try again.';
        }
      }
  }

  return {
    status,
    code: typeof data?.error === 'string' ? data.error : undefined,
    message,
    fieldErrors: errors,
    raw: err,
  };
}
