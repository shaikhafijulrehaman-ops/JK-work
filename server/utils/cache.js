const cacheStore = {};

const getCache = (key) => {
  const entry = cacheStore[key];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > entry.ttl) {
    delete cacheStore[key];
    return null;
  }
  return entry.value;
};

const setCache = (key, value, ttl = 30000) => {
  cacheStore[key] = {
    value,
    timestamp: Date.now(),
    ttl
  };
};

const invalidateCache = (pattern) => {
  const keys = Object.keys(cacheStore);
  keys.forEach(key => {
    if (key.includes(pattern)) {
      delete cacheStore[key];
    }
  });
};

const clearCache = () => {
  for (const key in cacheStore) {
    delete cacheStore[key];
  }
};

const cacheMiddleware = (ttl = 10000) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    const key = req.originalUrl || req.url;
    const cached = getCache(key);
    if (cached) {
      return res.status(200).json(cached);
    }
    
    const originalJson = res.json;
    res.json = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setCache(key, body, ttl);
      }
      return originalJson.call(this, body);
    };
    
    next();
  };
};

module.exports = {
  getCache,
  setCache,
  invalidateCache,
  clearCache,
  cacheMiddleware
};
