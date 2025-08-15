'use client'

import NextImage, { ImageProps as NextImageProps } from 'next/image'
import { useState } from 'react'

interface ImageProps extends Omit<NextImageProps, 'onError'> {
  fallback?: string
}

export default function Image({ 
  src, 
  alt, 
  fallback = '/images/placeholder.jpg',
  className = '',
  ...props 
}: ImageProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [isLoading, setIsLoading] = useState(true)

  const handleError = () => {
    setImgSrc(fallback)
  }

  const handleLoad = () => {
    setIsLoading(false)
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      <NextImage
        {...props}
        src={imgSrc}
        alt={alt}
        onError={handleError}
        onLoad={handleLoad}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${className}`}
      />
    </div>
  )
}