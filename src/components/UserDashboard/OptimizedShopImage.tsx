import React, { useState, useEffect } from 'react';
import { isImagePreloaded } from '../../utils/imagePreloader';

interface OptimizedShopImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  loading?: 'lazy' | 'eager';
}

export default function OptimizedShopImage({
  src,
  alt,
  className = '',
  containerClassName = '',
  loading = 'lazy'
}: OptimizedShopImageProps) {
  const [isLoaded, setIsLoaded] = useState<boolean>(() => isImagePreloaded(src));
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    setHasError(false);
    if (isImagePreloaded(src)) {
      setIsLoaded(true);
      return;
    }

    const img = new Image();
    img.src = src;
    if (img.complete && img.naturalWidth > 0) {
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [src]);

  return (
    <div className={`relative w-full h-full overflow-hidden bg-zinc-900 ${containerClassName}`}>
      {/* Skeleton Shimmer de carregamento */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 animate-pulse" />
      )}

      {/* Fallback de erro */}
      {hasError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-zinc-600 text-xs font-mono">
          Imagem indisponível
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`${className} transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
}
