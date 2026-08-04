import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

// Persistent localStorage cache to prevent duplicate URL resolution across reloads
const loadUrlCache = () => {
  try {
    const data = localStorage.getItem('resolved_url_cache');
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
};

const saveUrlCache = (cache) => {
  try {
    localStorage.setItem('resolved_url_cache', JSON.stringify(cache));
  } catch (e) {}
};

const resolvedUrlCache = loadUrlCache();
const failedImagesCache = new Set();

export const getServiceImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('data:image')) return imageUrl;
  
  const cacheKey = imageUrl;
  if (resolvedUrlCache[cacheKey]) {
    return resolvedUrlCache[cacheKey];
  }

  // Handle standard HTTP URLs (non-Supabase or already complete public Supabase URLs)
  if (imageUrl.startsWith('http')) {
    resolvedUrlCache[cacheKey] = imageUrl;
    saveUrlCache(resolvedUrlCache);
    return imageUrl;
  }

  // Parse Supabase Storage bucket and file path if format matches
  let bucketName = 'service-images';
  let filePath = imageUrl;

  if (imageUrl.startsWith('storage://')) {
    const parts = imageUrl.replace('storage://', '').split('/');
    bucketName = parts[0];
    filePath = parts.slice(1).join('/');
  } else if (!imageUrl.startsWith('/') && imageUrl.includes('/')) {
    const parts = imageUrl.split('/');
    bucketName = parts[0];
    filePath = parts.slice(1).join('/');
  } else if (imageUrl.startsWith('/')) {
    // Local public asset path (e.g., "/services/kitchen.webp")
    resolvedUrlCache[cacheKey] = imageUrl;
    saveUrlCache(resolvedUrlCache);
    return imageUrl;
  }

  try {
    // Synchronously construct public URL using Supabase Storage SDK (0ms, 0 network API calls)
    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    if (data && data.publicUrl) {
      resolvedUrlCache[cacheKey] = data.publicUrl;
      saveUrlCache(resolvedUrlCache);
      return data.publicUrl;
    }
  } catch (err) {
    console.error('[ServiceImage] Error formatting public URL from Supabase storage:', err);
  }

  resolvedUrlCache[cacheKey] = imageUrl;
  saveUrlCache(resolvedUrlCache);
  return imageUrl;
};

// Global image preloader function to cache images in the browser
export const preloadServiceImages = (services) => {
  if (!services || !Array.isArray(services)) return;
  
  services.forEach((s) => {
    if (s && s.imageUrl) {
      const url = getServiceImageUrl(s.imageUrl);
      if (url && !url.startsWith('data:image') && !failedImagesCache.has(url)) {
        const img = new Image();
        img.src = url;
      }
    }
  });
};

export const ServiceImage = ({ src, alt, className, priority = false }) => {
  const [resolvedSrc, setResolvedSrc] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const retryCount = useRef(0);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(false);
    
    if (!src) {
      setLoading(false);
      setError(true);
      return;
    }

    if (failedImagesCache.has(src)) {
      setLoading(false);
      setError(true);
      return;
    }

    const url = getServiceImageUrl(src);
    if (active) {
      setResolvedSrc(url);
      
      // Base64 images or local assets load instantly
      if (url.startsWith('data:image')) {
        setLoading(false);
      }
    }

    return () => {
      active = false;
    };
  }, [src]);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    if (retryCount.current < 1 && resolvedSrc) {
      retryCount.current += 1;
      // Retry once by appending retry flag to bypass cached 404 response
      const separator = resolvedSrc.includes('?') ? '&' : '?';
      setResolvedSrc(resolvedSrc + separator + 'retry=1');
    } else {
      setLoading(false);
      setError(true);
      if (src) {
        failedImagesCache.add(src);
      }
    }
  };

  if (error) {
    return (
      <div className="image-fallback absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-slate-400 p-4 border border-slate-250/20 rounded-2xl select-none">
        <svg className="w-8 h-8 text-slate-300 mb-1 animate-pulse" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"></path>
        </svg>
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400/80">No Image</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative flex items-center justify-center bg-slate-50">
      {/* Loading Skeleton Indicator */}
      {loading && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-slate-300 border-t-brand rounded-full animate-spin"></div>
        </div>
      )}
      
      {resolvedSrc && (
        <img
          src={resolvedSrc}
          alt={alt || 'Service image'}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={handleLoad}
          onError={handleError}
          className={`${className || ''} transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
        />
      )}
    </div>
  );
};


