"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import React from 'react';

interface VideoBackgroundProps {
  children?: React.ReactNode;
}

// Video asset configuration
const VIDEO_ASSET = {
  video: '/3d.mp4',
  poster: '/3d-poster.jpg'
} as const;

export default function VideoBackground({ children }: VideoBackgroundProps) {
  const [isClient, setIsClient] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);

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
  const loadVideo = useCallback(async () => {
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

    loadVideo();
  }, [isClient, userInteracted, loadVideo]);

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
            backgroundColor: 'black',
            backgroundImage: `url(${VIDEO_ASSET.poster})`,
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
        {/* Single video */}
        <video
          ref={videoRef}
          src={VIDEO_ASSET.video}
          poster={VIDEO_ASSET.poster}
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
            backgroundImage: `url(${VIDEO_ASSET.poster})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: !videoReady || !userInteracted ? 1 : 0,
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