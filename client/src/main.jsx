import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Production Error Boundary to prevent blank white screens permanently
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[JK Production ErrorBoundary caught error]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-inter text-center">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="font-poppins font-extrabold text-slate-800 text-lg">JK Home Care</h2>
              <p className="text-xs text-slate-500 font-medium">
                We're updating your dashboard details. Click below to reload.
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-brand hover:bg-brand-dark text-white font-poppins font-black text-xs uppercase tracking-wider py-3 rounded-xl shadow-md transition-all"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Global Fetch Interceptor with 100% Mutation Safety
const originalFetch = window.fetch;
const activeRequests = {};

window.fetch = async function (url, options = {}) {
  try {
    const targetUrl = typeof url === 'string' ? url : (url && url.url ? url.url : '');
    const isApi = typeof targetUrl === 'string' && targetUrl.includes('/api');
    
    if (!isApi) {
      return originalFetch(url, options);
    }

    const method = (options && options.method) ? options.method : 'GET';
    const cacheKey = targetUrl || 'api_req';

    if (method.toUpperCase() === 'GET') {
      if (activeRequests[cacheKey]) {
        const res = await activeRequests[cacheKey];
        return res.clone();
      }

      const promise = (async () => {
        try {
          return await executeFetch(url, options);
        } catch (err) {
          delete activeRequests[cacheKey];
          throw err;
        } finally {
          setTimeout(() => {
            delete activeRequests[cacheKey];
          }, 500);
        }
      })();

      activeRequests[cacheKey] = promise;
      const response = await promise;
      return response.clone();
    }

    return executeFetch(url, options);
  } catch (globalFetchErr) {
    console.warn('[Fetch Interceptor Warning]: Falling back to original fetch:', globalFetchErr);
    return originalFetch(url, options);
  }
};

async function executeFetch(url, options = {}) {
  const token = localStorage.getItem('jk_token');
  const safeOptions = { ...options };
  const headers = { ...(safeOptions.headers || {}) };
  
  if (token && !headers['Authorization'] && !headers['authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  safeOptions.headers = headers;

  const targetUrl = typeof url === 'string' ? url : (url && url.url ? url.url : '');
  const isNotification = typeof targetUrl === 'string' && targetUrl.includes('/notifications');
  const timeout = safeOptions.timeout || 5000;
  const retries = isNotification ? 0 : (safeOptions.hasOwnProperty('retries') ? safeOptions.retries : 2);
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    let signalListener;
    if (safeOptions.signal) {
      if (safeOptions.signal.aborted) {
        controller.abort();
      } else {
        signalListener = () => controller.abort();
        safeOptions.signal.addEventListener('abort', signalListener);
      }
    }

    try {
      const response = await originalFetch(url, {
        ...safeOptions,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (safeOptions.signal && signalListener) {
        safeOptions.signal.removeEventListener('abort', signalListener);
      }
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      if (safeOptions.signal && signalListener) {
        safeOptions.signal.removeEventListener('abort', signalListener);
      }
      
      const isAbort = err.name === 'AbortError' || err.message?.toLowerCase().includes('abort');
      lastError = isAbort ? new Error('Request timed out. Please try again.') : err;
      
      if (!isNotification) {
        console.warn(`[Fetch Interceptor] Attempt ${attempt + 1} to ${targetUrl} failed: ${err.message}. ${attempt < retries ? 'Retrying...' : 'All attempts exhausted.'}`);
      }
      
      if (attempt === retries) {
        throw lastError;
      }
    }
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

