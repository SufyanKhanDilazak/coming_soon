"use client";

import { useEffect, useState, useRef } from 'react';
import React from 'react';

interface BackgroundVideoProps {
  children?: React.ReactNode;
}

export default function BackgroundVideo({ children }: BackgroundVideoProps) {
  const [isClient, setIsClient] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Detect if device is mobile
  useEffect(() => {
    setIsClient(true);
    
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
      return mobileKeywords.some(keyword => userAgent.includes(keyword)) || window.innerWidth <= 768;
    };

    setIsMobile(checkMobile());

    // Check for Safari/iOS which requires user interaction
    const isSafariOrIOS = /iPad|iPhone|iPod|Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent);
    
    if (!isSafariOrIOS) {
      setUserInteracted(true);
    }
  }, []);

  // Handle user interaction for Safari/iOS
  useEffect(() => {
    if (userInteracted) return;

    const handleInteraction = () => {
      setUserInteracted(true);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('click', handleInteraction);
    };

    document.addEventListener('touchstart', handleInteraction, { passive: true });
    document.addEventListener('click', handleInteraction);

    return () => {
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('click', handleInteraction);
    };
  }, [userInteracted]);

  // Load and play video
  useEffect(() => {
    if (!isClient || !userInteracted || !videoRef.current) return;

    const video = videoRef.current;
    
    const loadVideo = async () => {
      try {
        video.load();
        
        const playPromise = video.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
        
        setVideoLoaded(true);
      } catch (error) {
        console.warn('Video autoplay failed:', error);
        // Video will show poster instead
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(loadVideo, 100);
    
    return () => clearTimeout(timer);
  }, [isClient, userInteracted]);

  const videoSrc = isMobile ? '/4dm.mp4' : '/4d.mp4';
  const posterSrc = isMobile ? '/4dm-poster.jpg' : '/4d-poster.jpg';

  // SSR fallback
  if (!isClient) {
    return (
      <>
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            backgroundColor: '#000',
            backgroundImage: `url(/4d-poster.jpg)`,
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
      {/* Fixed video background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: -1, overflow: 'hidden' }}>
        <video
          ref={videoRef}
          src={videoSrc}
          poster={posterSrc}
          muted
          playsInline
          loop
          preload="metadata"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: videoLoaded ? 1 : 0,
            transition: 'opacity 0.5s ease-in-out',
          }}
        />
        
        {/* Poster fallback */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${posterSrc})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: videoLoaded ? 0 : 1,
            transition: 'opacity 0.5s ease-in-out',
          }}
        />
      </div>

      {/* iOS/Safari interaction prompt */}
      {!userInteracted && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setUserInteracted(true)}
        >
          <div
            style={{
              color: 'white',
              textAlign: 'center',
              padding: '24px',
              borderRadius: '12px',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <p style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
              Tap to Enable Background
            </p>
            <p style={{ fontSize: '14px', opacity: 0.8, margin: 0 }}>
              Required for video playback
            </p>
          </div>
        </div>
      )}

      {children}
    </>
  );
}