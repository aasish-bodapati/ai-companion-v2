// Internal: consume a single SSE connection until it ends (no reconnect)
async function consumeSSEOnce(
  response: Response,
  {
    signal,
    onEvent,
    onError,
  }: {
    signal?: AbortSignal;
    onEvent: (event: string | null, data: string) => void;
    onError?: (err: unknown) => void;
  }
) {
  console.log('🔍 SSE: Starting consumeSSEOnce');
  const ct = response.headers.get('content-type') || '';
  console.log('🔍 SSE: Content-Type:', ct);
  
  if (!ct.toLowerCase().includes('text/event-stream')) {
    let preview = '';
    try { preview = (await response.clone().text()).slice(0, 200); } catch {}
    console.error('🔍 SSE: Expected SSE but got wrong content type:', ct, 'Body preview:', preview);
    throw new Error(`Expected SSE but got '${ct}'. Body: ${preview}`);
  }
  
  console.log('🔍 SSE: Content-Type is correct, getting reader');
  const reader = response.body?.getReader();
  if (!reader) {
    console.error('🔍 SSE: No reader available');
    return;
  }
  
  console.log('🔍 SSE: Reader obtained, starting to read');
  const decoder = new TextDecoder();
  let buffer = '';
  let chunkCount = 0;
  
  try {
    while (true) {
      if (signal?.aborted) {
        console.log('🔍 SSE: Signal aborted, stopping');
        break;
      }
      
      console.log('🔍 SSE: Reading chunk', chunkCount + 1);
      const { done, value } = await reader.read();
      chunkCount++;
      
      if (done) {
        console.log('🔍 SSE: Reader done, stopping');
        break;
      }
      
      console.log('🔍 SSE: Got chunk of size:', value?.length || 0);
      buffer += decoder.decode(value, { stream: true });
      console.log('🔍 SSE: Buffer now contains:', buffer.length, 'characters');
      
      let idx;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const raw = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const lines = raw.split('\n');
        let event: string | null = null;
        const dataParts: string[] = [];
        for (const line of lines) {
          if (line.startsWith('event:')) event = line.slice(6).trim();
          else if (line.startsWith('data:')) dataParts.push(line.slice(5).trim());
        }
        const data = dataParts.join('\n');
        console.log('🔍 SSE: Parsed event:', event, 'data length:', data.length);
        onEvent(event, data);
      }
    }
  } catch (e) {
    console.error('🔍 SSE: Error during consumption:', e);
    onError?.(e);
  } finally {
    console.log('🔍 SSE: Cleaning up reader');
    try { reader.releaseLock(); } catch {}
  }
  
  console.log('🔍 SSE: consumeSSEOnce completed');
}

// Public: Simple one-shot SSE consumer (back-compat wrapper around consumeSSEOnce)
export async function consumeSSE(
  response: Response,
  opts: {
    signal?: AbortSignal;
    onEvent: (event: string | null, data: string) => void;
    onError?: (err: unknown) => void;
  }
) {
  return consumeSSEOnce(response, opts);
}

// Public: SSE consumer with reconnect/backoff
// open: function that (re)opens the SSE Response
export async function consumeSSEWithReconnect(
  open: () => Promise<Response>,
  {
    signal,
    onEvent,
    onError,
    isTerminalEvent,
    maxRetries = 5,
    baseDelayMs = 500,
    maxDelayMs = 8000,
  }: {
    signal?: AbortSignal;
    onEvent: (event: string | null, data: string) => void;
    onError?: (err: unknown) => void;
    isTerminalEvent?: (event: string | null, data: string) => boolean;
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
  }
) {
  console.log('🔍 SSE: Starting consumeSSEWithReconnect');
  let attempt = 0;
  let stop = false;
  
  while (!stop) {
    if (signal?.aborted) {
      console.log('🔍 SSE: Signal aborted, stopping reconnect loop');
      break;
    }
    
    let sawTerminal = false;
    try {
      console.log('🔍 SSE: Attempt', attempt + 1, 'of', maxRetries + 1);
      console.log('🔍 SSE: Calling open() function');
      const resp = await open();
      console.log('🔍 SSE: Got response, status:', resp.status, 'headers:', Object.fromEntries(resp.headers.entries()));
      
      await consumeSSEOnce(resp, {
        signal,
        onEvent: (event, data) => {
          console.log('🔍 SSE: Event callback:', event, 'data length:', data.length);
          onEvent(event, data);
          if (isTerminalEvent && isTerminalEvent(event, data)) {
            console.log('🔍 SSE: Terminal event detected, stopping');
            sawTerminal = true;
          }
        },
        onError,
      });
      
      if (sawTerminal) {
        console.log('🔍 SSE: Terminal event seen, stopping gracefully');
        stop = true; // graceful terminal event
        break;
      }
      
      console.log('🔍 SSE: consumeSSEOnce completed without terminal event');
    } catch (e) {
      console.error('🔍 SSE: Error in attempt', attempt + 1, ':', e);
      onError?.(e);
    }
    
    // If aborted or retries exhausted, stop
    if (signal?.aborted) {
      console.log('🔍 SSE: Signal aborted after error, stopping');
      break;
    }
    
    if (attempt >= maxRetries) {
      console.log('🔍 SSE: Max retries reached, stopping');
      break;
    }
    
    // Exponential backoff with jitter
    const delay = Math.min(maxDelayMs, Math.round(baseDelayMs * Math.pow(2, attempt) * (0.5 + Math.random())));
    console.log('🔍 SSE: Waiting', delay, 'ms before retry');
    await new Promise((r) => setTimeout(r, delay));
    attempt += 1;
  }
  
  console.log('🔍 SSE: consumeSSEWithReconnect completed');
}
