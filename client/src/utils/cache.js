const cacheStore = {};
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

export const getCache = (key) => {
  const entry = cacheStore[key];
  if (entry && (Date.now() - entry.timestamp < DEFAULT_TTL)) {
    return entry.data;
  }
  // Cache miss or expired
  if (entry) {
    delete cacheStore[key];
  }
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
