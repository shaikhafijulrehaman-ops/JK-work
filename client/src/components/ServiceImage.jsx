import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

// In-memory cache to prevent duplicate URL resolution and redundant network requests
const resolvedUrlCache = {};
const failedImagesCache = new Set();

const getServiceImageUrl = async (imageUrl) => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('data:image')) return imageUrl;
  if (imageUrl.startsWith('http') && !imageUrl.includes('supabase.co')) return imageUrl;

  const cacheKey = imageUrl;
  if (resolvedUrlCache[cacheKey]) {
    return resolvedUrlCache[cacheKey];
  }

  // Parse Supabase Storage bucket and file path if format matches
  let bucketName = 'service-images';
  let filePath = imageUrl;

  if (imageUrl.includes('supabase.co/storage/v1/object/')) {
    const parts = imageUrl.split('/storage/v1/object/');
    if (parts.length > 1) {
      const subParts = parts[1].split('/');
      bucketName = subParts[1];
      filePath = subParts.slice(2).join('/');
    }
  } else if (imageUrl.startsWith('storage://')) {
    const parts = imageUrl.replace('storage://', '').split('/');
    bucketName = parts[0];
    filePath = parts.slice(1).join('/');
  } else if (!imageUrl.startsWith('/') && imageUrl.includes('/')) {
    const parts = imageUrl.split('/');
    bucketName = parts[0];
    filePath = parts.slice(1).join('/');
  } else {
    // Local public path (e.g., "/services/kitchen.webp")
    return imageUrl;
  }

  try {
    // Attempt to generate a signed URL (valid for 1 hour) to handle both private and public buckets
    const { data: signedData } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 3600);
      
    if (signedData && signedData.signedUrl) {
      resolvedUrlCache[cacheKey] = signedData.signedUrl;
      return signedData.signedUrl;
    }

    // Fallback to public URL if signed URL generation is restricted
    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    if (data && data.publicUrl) {
      resolvedUrlCache[cacheKey] = data.publicUrl;
      return data.publicUrl;
    }
  } catch (err) {
    console.error('[ServiceImage] Error resolving URL from Supabase storage:', err);
  }

  return imageUrl;
};

// Global image preloader function to cache images in the browser
export const preloadServiceImages = async (services) => {
  if (!services || !Array.isArray(services)) return;
  
  services.forEach(async (s) => {
    if (s.imageUrl) {
      const url = await getServiceImageUrl(s.imageUrl);
      if (url && !url.startsWith('data:image')) {
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

    const resolveUrl = async () => {
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

      const url = await getServiceImageUrl(src);
      if (active) {
        setResolvedSrc(url);
        
        // Base64 images load instantly
        if (url.startsWith('data:image')) {
          setLoading(false);
        }
      }
    };

    resolveUrl();

    return () => {
      active = false;
    };
  }, [src]);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    if (retryCount.current < 1) {
      retryCount.current += 1;
      // Retry once by appending retry flag to bypass/refresh cached request
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
      <div className="image-fallback absolute inset-0 flex items-center justify-center bg-slate-100 text-[10px] sm:text-xs font-semibold text-slate-400">
        Image Not Available
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
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={handleLoad}
          onError={handleError}
          className={`${className} transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
        />
      )}
    </div>
  );
};
