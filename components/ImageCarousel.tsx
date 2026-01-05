'use client'

import { useState, useEffect, useRef } from 'react'

interface ImageCarouselProps {
  images: string[]
  onClose: () => void
  placeDescription?: string
  location?: string
}

export function ImageCarousel({ images, onClose, placeDescription, location }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  // Swipe detection
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && currentIndex < images.length - 1) {
      handleNext()
    }
    if (isRightSwipe && currentIndex > 0) {
      handlePrevious()
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        handlePrevious()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [currentIndex])


  if (images.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md mx-4 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">No Photos Yet</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">Add photos to showcase this destination!</p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Top bar - Instagram style */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
        {/* Close button */}
        <button
          onClick={onClose}
          className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image counter */}
        {images.length > 1 && (
          <div className="text-white text-sm font-medium">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Spacer for alignment */}
        <div className="w-10" />
      </div>

      {/* Main carousel area - Instagram style */}
      <div 
        ref={containerRef}
        className="flex-1 flex items-center justify-center relative overflow-hidden bg-black"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Image container with swipe support */}
        <div className="relative w-full h-full flex items-center justify-center">
          <div 
            className="flex transition-transform duration-300 ease-out"
            style={{
              transform: `translateX(-${currentIndex * 100}%)`,
              width: `${images.length * 100}%`,
            }}
          >
            {images.map((image, index) => (
              <div
                key={index}
                className="w-full h-full flex-shrink-0 flex items-center justify-center"
                style={{ width: `${100 / images.length}%` }}
              >
                <div className="relative w-full h-full max-h-screen flex items-center justify-center">
                  <img
                    src={image}
                    alt={`Destination ${index + 1}`}
                    className="w-full h-full object-contain"
                    draggable={false}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="800"%3E%3Crect fill="%23ddd" width="800" height="800"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="sans-serif" font-size="24"%3EImage not found%3C/text%3E%3C/svg%3E'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation arrows - only show on hover/desktop */}
        {images.length > 1 && (
          <>
            {currentIndex > 0 && (
              <button
                onClick={handlePrevious}
                className="hidden md:flex absolute left-4 z-40 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-all duration-200 backdrop-blur-sm"
                aria-label="Previous"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {currentIndex < images.length - 1 && (
              <button
                onClick={handleNext}
                className="hidden md:flex absolute right-4 z-40 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-all duration-200 backdrop-blur-sm"
                aria-label="Next"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </>
        )}

        {/* Tap zones for mobile */}
        <div className="absolute inset-0 flex z-30 md:hidden">
          <div 
            className="flex-1" 
            onClick={() => currentIndex > 0 && handlePrevious()}
          />
          <div 
            className="flex-1" 
            onClick={() => currentIndex < images.length - 1 && handleNext()}
          />
        </div>
      </div>

      {/* Dots indicator - Instagram style */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentIndex
                  ? 'w-8 h-1.5 bg-white'
                  : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Place details footer - Instagram style bottom sheet */}
      {(placeDescription || location) && (
        <div className="absolute bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black via-black/95 to-transparent pb-20 pt-8">
          <div className="max-w-2xl mx-auto px-6">
            {location && (
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-5 h-5 text-white/80 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-white font-semibold text-base">{location}</span>
              </div>
            )}
            {placeDescription && (
              <p className="text-white/90 text-sm leading-relaxed">{placeDescription}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

