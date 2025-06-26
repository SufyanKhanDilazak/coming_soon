"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import React from 'react';

interface BackgroundVideoProps {
  children?: React.ReactNode;
}

// Pre-define video assets for better performance
const VIDEO_ASSETS = {
  desktop: { video: '/4d.mp4', poster: '/4d-poster.jpg' },
  mobile: { video: '/4dm.mp4', poster: '/4dm-poster.jpg' }
} as const;

export default function BackgroundVideo({ children }: BackgroundVideoProps) {
  const [isClient, setIsClient] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect browser capabilities
  const isSafariOrIOS = useCallback(() => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent;
    return /iPad|iPhone|iPod|Safari/i.test(ua) && !/Chrome/i.test(ua);
  }, []);

  // Mobile detection function
  const checkMobile = useCallback(() => {
    if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;
    const userAgent = navigator.userAgent.toLowerCase();
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) || 
           window.innerWidth <= 768;
  }, []);

  // Client-side initialization with interaction detection
  useEffect(() => {
    setIsClient(true);
    
    // Set mobile detection
    setIsMobile(checkMobile());
    
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
  }, [isSafariOrIOS, checkMobile]);

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

  // Handle window resize for mobile detection
  useEffect(() => {
    if (!isClient) return;

    const handleResize = () => {
      setIsMobile(checkMobile());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isClient, checkMobile]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  // Get current video assets based on mobile detection
  const currentAssets = isMobile ? VIDEO_ASSETS.mobile : VIDEO_ASSETS.desktop;

  // Common video properties
  const videoProps = {
    muted: true,
    playsInline: true,
    loop: true,
    preload: 'auto' as const,
    controls: false,
  };

  const videoStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    pointerEvents: 'none',
    transition: 'opacity 0.5s ease-in-out',
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
            backgroundImage: `url(${VIDEO_ASSETS.desktop.poster})`,
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
      <div style={{ position: 'fixed', inset: 0, zIndex: -1, overflow: 'hidden' }}>
        {/* Main video */}
        <video
          ref={videoRef}
          src={currentAssets.video}
          poster={currentAssets.poster}
          {...videoProps}
          style={{
            ...videoStyle,
            opacity: videoReady && userInteracted ? 1 : 0,
          }}
        />
        
        {/* Fallback background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${currentAssets.poster})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
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