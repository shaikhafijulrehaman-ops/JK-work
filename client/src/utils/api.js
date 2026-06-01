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
      throw new Error('Unable to load data. Retry.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};
