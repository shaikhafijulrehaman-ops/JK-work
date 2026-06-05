export const fetchWithTimeout = async (url, options = {}) => {
  const { timeout = 5000, ...rest } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);
  
  // If a parent signal was passed, propagate it to our timeout controller
  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort();
    } else {
      options.signal.addEventListener('abort', () => {
        controller.abort();
      });
    }
  }
  
  try {
    const response = await fetch(url, {
      ...rest,
      signal: controller.signal
    });
    return response;
  } catch (error) {
    if (error.name === 'AbortError' || error.message?.toLowerCase().includes('abort')) {
      if (options.signal?.aborted) {
        const parentAbort = new Error('Request aborted by caller');
        parentAbort.name = 'AbortError';
        throw parentAbort;
      }
      throw new Error('Request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const fetchWithRetry = async (url, options = {}) => {
  const { retries = 3, backoff = 1000, ...rest } = options;
  
  let lastError;
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetchWithTimeout(url, { ...rest });
      return response;
    } catch (error) {
      lastError = error;
      if (error.name === 'AbortError' || options.signal?.aborted) {
        // Immediately fail without retrying if request was aborted by caller/unmount
        throw error;
      }
      console.warn(`⚠️ Request failed (Attempt ${i + 1}/${retries + 1}): ${error.message || 'Error'}. Retrying in ${backoff}ms...`);
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, backoff));
      }
    }
  }
  throw lastError;
};
