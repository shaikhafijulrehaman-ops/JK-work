const cacheStore = {};
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

export const getCache = (key, options = {}) => {
  const entry = cacheStore[key];
  if (!entry) return null;

  const isExpired = Date.now() - entry.timestamp >= DEFAULT_TTL;
  if (!isExpired) {
    return entry.data;
  }

  if (options.allowStale) {
    return entry.data;
  }

  // Cache expired and stale not allowed
  delete cacheStore[key];
  return null;
};

export const setCache = (key, data) => {
  cacheStore[key] = {
    data,
    timestamp: Date.now()
  };
};

export const invalidateCache = (key) => {
  delete cacheStore[key];
};

export const clearCache = () => {
  for (const key in cacheStore) {
    delete cacheStore[key];
  }
};
