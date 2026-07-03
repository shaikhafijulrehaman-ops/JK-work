import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Global Fetch Timeout & Retry Wrapper (5s per attempt, 3 attempts max = 15s total)
const originalFetch = window.fetch;
window.fetch = async function (url, options = {}) {
  // If the request is not to our backend API, or explicitly skipped, bypass
  const isApi = typeof url === 'string' && url.includes('/api');
  if (!isApi) {
    return originalFetch(url, options);
  }

  // Automatically inject active Authorization Bearer token from localStorage
  const token = localStorage.getItem('jk_token');
  const headers = { ...options.headers };
  if (token && !headers['Authorization'] && !headers['authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  options.headers = headers;

  const timeout = options.timeout || 5000; // 5 seconds per attempt to handle serverless database cold starts gracefully
  const retries = options.hasOwnProperty('retries') ? options.retries : 2; // 2 retries default (total 3 attempts = 15s max)
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // Propagate existing signal if any
    let signalListener;
    if (options.signal) {
      if (options.signal.aborted) {
        controller.abort();
      } else {
        signalListener = () => controller.abort();
        options.signal.addEventListener('abort', signalListener);
      }
    }

    try {
      const response = await originalFetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (options.signal && signalListener) {
        options.signal.removeEventListener('abort', signalListener);
      }
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      if (options.signal && signalListener) {
        options.signal.removeEventListener('abort', signalListener);
      }
      
      const isAbort = err.name === 'AbortError' || err.message?.toLowerCase().includes('abort');
      lastError = isAbort ? new Error('Request timed out. Please try again.') : err;
      
      console.warn(`[Fetch Interceptor] Attempt ${attempt + 1} to ${url} failed: ${err.message}. ${attempt < retries ? 'Retrying...' : 'All attempts exhausted.'}`);
      
      if (attempt === retries) {
        throw lastError;
      }
    }
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

