"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import React from 'react';

interface BackgroundVideoProps {
  children?: React.ReactNode;
}

// Video assets for different screen sizes
const VIDEO_ASSETS = {
  desktop: '/4d.mp4',
  mobile: '/mp5.mp4',
  poster: '/4d-poster.jpg'
} as const;

export default function BackgroundVideo({ children }: BackgroundVideoProps) {
  const [isClient, setIsClient] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect mobile devices
  const detectMobile = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  // Detect browser capabilities
  const isSafariOrIOS = useCallback(() => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent;
    return /iPad|iPhone|iPod|Safari/i.test(ua) && !/Chrome/i.test(ua);
  }, []);

  // Handle resize events
  useEffect(() => {
    if (!isClient) return;
    
    const handleResize = () => {
      setIsMobile(detectMobile());
    };
    
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [isClient, detectMobile]);

  // Client-side initialization with interaction detection
  useEffect(() => {
    setIsClient(true);
    setIsMobile(detectMobile());
    
    // Check if user already interacted
    const hasInteracted = sessionStorage.getItem('videoInteraction') === 'true';
    
    if (hasInteracted || !isSafariOrIOS()) {
      setUserInteracted(true);
    } else {
      // Set up interaction listeners for Safari/iOS
      const handleInteraction = () => {
        setUserInteracted(true);
        sessionStorage.setItem('videoInteraction', 'true');
        document.removeEventListener('touchstart', handleInteraction);
        document.removeEventListener('click', handleInteraction);
      };
      
      document.addEventListener('touchstart', handleInteraction, { passive: true });
      document.addEventListener('click', handleInteraction);
      
      return () => {
        document.removeEventListener('touchstart', handleInteraction);
        document.removeEventListener('click', handleInteraction);
      };
    }
  }, [isSafariOrIOS, detectMobile]);

  // Optimized video loading function
  const loadVideo = useCallback(async (videoRef: React.RefObject<HTMLVideoElement | null>) => {
    const video = videoRef.current;
    if (!video || !userInteracted) return;

    try {
      video.load();
      
      // Set up promise-based loading
      await new Promise<void>((resolve, reject) => {
        const onCanPlay = () => {
          video.removeEventListener('canplaythrough', onCanPlay);
          video.removeEventListener('error', onError);
          resolve();
        };
        
        const onError = () => {
          video.removeEventListener('canplaythrough', onCanPlay);
          video.removeEventListener('error', onError);
          reject();
        };
        
        video.addEventListener('canplaythrough', onCanPlay);
        video.addEventListener('error', onError);
        
        // Timeout fallback
        setTimeout(() => {
          video.removeEventListener('canplaythrough', onCanPlay);
          video.removeEventListener('error', onError);
          resolve();
        }, 3000);
      });

      // Play video with error handling
      const playPromise = video.play();
      if (playPromise) {
        await playPromise.catch(() => {
          // Retry once for Safari
          setTimeout(() => video.play().catch(() => {}), 100);
        });
      }

      setVideoReady(true);
    } catch {
      // Fallback to poster on error
      setVideoReady(false);
    }
  }, [userInteracted]);

  // Initialize video when user interacts
  useEffect(() => {
    if (!isClient || !userInteracted) return;

    const initializeVideo = async () => {
      await loadVideo(videoRef);
    };

    initializeVideo();
  }, [isClient, userInteracted, loadVideo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  // Common video properties
  const videoProps = {
    muted: true,
    playsInline: true,
    loop: true,
    preload: 'auto' as const,
    controls: false,
  };

  // Responsive video styles
  const getVideoStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      transition: 'opacity 0.5s ease-in-out',
    };

    if (isMobile) {
      // On mobile, use cover for mobile-optimized video
      return {
        ...baseStyle,
        objectFit: 'cover',
      };
    } else {
      // On desktop, use cover for desktop video
      return {
        ...baseStyle,
        objectFit: 'cover',
      };
    }
  };

  // SSR fallback
  if (!isClient) {
    return (
      <>
        {/* Fixed background video container */}
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            backgroundColor: '#000',
            backgroundImage: `url(${VIDEO_ASSETS.poster})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: -1 
          }} 
        />
        {children}
      </>
    );
  }

  return (
    <>
      {/* Fixed video container - completely separate from content flow */}
      <div style={{ position: 'fixed', inset: 0, zIndex: -1, overflow: 'hidden', backgroundColor: '#000' }}>
        {/* Desktop video (hidden on mobile) */}
        <video
          ref={isMobile ? null : videoRef}
          src={VIDEO_ASSETS.desktop}
          poster={VIDEO_ASSETS.poster}
          {...videoProps}
          style={{
            ...getVideoStyle(),
            opacity: videoReady && userInteracted && !isMobile ? 1 : 0,
            display: isMobile ? 'none' : 'block',
          }}
        />

        {/* Mobile video (hidden on desktop) */}
        <video
          ref={isMobile ? videoRef : null}
          src={VIDEO_ASSETS.mobile}
          poster={VIDEO_ASSETS.poster}
          {...videoProps}
          style={{
            ...getVideoStyle(),
            opacity: videoReady && userInteracted && isMobile ? 1 : 0,
            display: isMobile ? 'block' : 'none',
          }}
        />
        
        {/* Fallback background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${VIDEO_ASSETS.poster})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundColor: '#000',
            opacity: !videoReady || !userInteracted ? 1 : 0,
            transition: 'opacity 0.5s ease-in-out',
            zIndex: -1,
          }}
        />
      </div>

      {/* iOS/Safari interaction overlay */}
      {isSafariOrIOS() && !userInteracted && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={() => {
            setUserInteracted(true);
            sessionStorage.setItem('videoInteraction', 'true');
          }}
        >
          <div
            style={{
              color: 'white',
              textAlign: 'center',
              padding: '24px',
              borderRadius: '12px',
              backgroundColor: 'rgba(0,0,0,0.8)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <p style={{ fontSize: '18px', fontWeight: '500', margin: '0 0 8px 0' }}>
              Tap to Enable Background
            </p>
            <p style={{ fontSize: '14px', opacity: 0.8, margin: 0 }}>
              Required for video playback
            </p>
          </div>
        </div>
      )}

      {/* Content - no wrapper div, just pass through children */}
      {children}
    </>
  );
}