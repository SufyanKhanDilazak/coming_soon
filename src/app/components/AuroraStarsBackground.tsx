"use client";

import { useTheme } from './theme-context';
import { useEffect, useState, useRef, useCallback } from 'react';
import React from 'react';

interface AuroraStarsBackgroundProps {
  children?: React.ReactNode;
}

// Pre-define video assets for better performance
const VIDEO_ASSETS = {
  dark: { video: '/3d.mp4', poster: '/3d-poster.jpg' },
  light: { video: '/sky.mp4', poster: '/sky-poster.jpg' }
} as const;

export default function AuroraStarsBackground({ children }: AuroraStarsBackgroundProps) {
  const { isDarkMode, isThemeLoaded } = useTheme();
  const [isClient, setIsClient] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [videoReady, setVideoReady] = useState({ light: false, dark: false });
  const [activeVideo, setActiveVideo] = useState<'light' | 'dark'>('light');
  
  const lightVideoRef = useRef<HTMLVideoElement>(null);
  const darkVideoRef = useRef<HTMLVideoElement>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect browser capabilities
  const isSafariOrIOS = useCallback(() => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent;
    return /iPad|iPhone|iPod|Safari/i.test(ua) && !/Chrome/i.test(ua);
  }, []);

  // Client-side initialization with interaction detection
  useEffect(() => {
    setIsClient(true);
    
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
  }, [isSafariOrIOS]);

  // Optimized video loading function
  const loadVideo = useCallback(async (videoRef: React.RefObject<HTMLVideoElement | null>, type: 'light' | 'dark') => {
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

      setVideoReady(prev => ({ ...prev, [type]: true }));
    } catch {
      // Fallback to poster on error
      setVideoReady(prev => ({ ...prev, [type]: false }));
    }
  }, [userInteracted]);

  // Initialize both videos when user interacts
  useEffect(() => {
    if (!isClient || !userInteracted || !isThemeLoaded) return;

    const initializeVideos = async () => {
      // Load both videos in parallel
      await Promise.allSettled([
        loadVideo(lightVideoRef, 'light'),
        loadVideo(darkVideoRef, 'dark')
      ]);
    };

    initializeVideos();
  }, [isClient, userInteracted, isThemeLoaded, loadVideo]);

  // Handle theme switching with smooth transitions
  useEffect(() => {
    if (!isThemeLoaded || !userInteracted) return;

    const newActiveVideo = isDarkMode ? 'dark' : 'light';
    
    if (newActiveVideo !== activeVideo) {
      // Clear any pending transitions
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }

      // Smooth transition logic
      const currentRef = activeVideo === 'light' ? lightVideoRef : darkVideoRef;
      const nextRef = newActiveVideo === 'light' ? lightVideoRef : darkVideoRef;

      if (currentRef.current) {
        currentRef.current.style.opacity = '0';
      }

      if (nextRef.current && videoReady[newActiveVideo]) {
        nextRef.current.style.opacity = '1';
        nextRef.current.currentTime = 0;
        nextRef.current.play().catch(() => {});
      }

      // Update active video after transition
      transitionTimeoutRef.current = setTimeout(() => {
        setActiveVideo(newActiveVideo);
      }, 300);
    }
  }, [isDarkMode, isThemeLoaded, userInteracted, activeVideo, videoReady]);

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

  const videoStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    pointerEvents: 'none',
    transition: 'opacity 0.3s ease-in-out',
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
            backgroundColor: 'white',
            backgroundImage: `url(${VIDEO_ASSETS.light.poster})`,
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
        {/* Light theme video */}
        <video
          ref={lightVideoRef}
          src={VIDEO_ASSETS.light.video}
          poster={VIDEO_ASSETS.light.poster}
          {...videoProps}
          style={{
            ...videoStyle,
            opacity: !isDarkMode && videoReady.light && userInteracted ? 1 : 0,
          }}
        />
        
        {/* Dark theme video */}
        <video
          ref={darkVideoRef}
          src={VIDEO_ASSETS.dark.video}
          poster={VIDEO_ASSETS.dark.poster}
          {...videoProps}
          style={{
            ...videoStyle,
            opacity: isDarkMode && videoReady.dark && userInteracted ? 1 : 0,
          }}
        />
        
        {/* Fallback background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${isDarkMode ? VIDEO_ASSETS.dark.poster : VIDEO_ASSETS.light.poster})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: (!videoReady.light && !isDarkMode) || (!videoReady.dark && isDarkMode) || !userInteracted ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
            zIndex: -1,
          }}
        />
      </div>

      {/* iOS/Safari interaction overlay */}
      {isSafariOrIOS() && !userInteracted && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => {
            setUserInteracted(true);
            sessionStorage.setItem('videoInteraction', 'true');
          }}
        >
          <div className="text-white text-center p-6 rounded-xl bg-black/80 shadow-2xl border border-white/20">
            <p className="text-lg font-medium mb-2">Tap to Enable Background</p>
            <p className="text-sm opacity-80">Required for video playback</p>
          </div>
        </div>
      )}

      {/* Content - no wrapper div, just pass through children */}
      {children}
    </>
  );
}