"use client";

import { useEffect, useState, useRef } from 'react';

interface BackgroundVideoProps {
  children?: React.ReactNode;
}

export default function BackgroundVideo({ children }: BackgroundVideoProps) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [needsInteraction, setNeedsInteraction] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setMounted(true);
    
    // Mobile detection
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) || 
             window.innerWidth <= 768;
    };

    const mobile = checkMobile();
    setIsMobile(mobile);

    // Check if interaction is needed (iOS/Safari)
    const needsUserInteraction = /iPad|iPhone|iPod|Safari/i.test(navigator.userAgent) && 
                                !/Chrome/i.test(navigator.userAgent);
    
    setNeedsInteraction(needsUserInteraction);

    // Auto-play for other browsers
    if (!needsUserInteraction) {
      setTimeout(() => playVideo(), 100);
    }
  }, []);

  const playVideo = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      video.currentTime = 0;
      await video.play();
      setVideoReady(true);
    } catch {
      console.log('Autoplay prevented, waiting for user interaction');
    }
  };

  const handleUserInteraction = () => {
    setNeedsInteraction(false);
    playVideo();
  };

  const videoSrc = isMobile ? '/4dm.mp4' : '/4d.mp4';
  const posterSrc = isMobile ? '/4dm-poster.jpg' : '/4d-poster.jpg';

  if (!mounted) {
    return (
      <>
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            backgroundColor: '#000',
            backgroundImage: 'url(/4d-poster.jpg)',
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
      {/* Fixed Video Background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: -1 }}>
        <video
          ref={videoRef}
          src={videoSrc}
          poster={posterSrc}
          muted
          playsInline
          loop
          preload="metadata"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: videoReady ? 1 : 0,
            transition: 'opacity 0.5s ease',
          }}
        />
        
        {/* Poster Background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${posterSrc})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: videoReady ? 0 : 1,
            transition: 'opacity 0.5s ease',
          }}
        />
      </div>

      {/* User Interaction Overlay */}
      {needsInteraction && (
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
          onClick={handleUserInteraction}
        >
          <div
            style={{
              color: 'white',
              textAlign: 'center',
              padding: '24px',
              borderRadius: '12px',
              backgroundColor: 'rgba(0,0,0,0.8)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <p style={{ fontSize: '18px', fontWeight: '500', margin: '0 0 8px 0' }}>
              Tap to play
            </p>
            <p style={{ fontSize: '14px', opacity: 0.7, margin: 0 }}>
              Touch to continue
            </p>
          </div>
        </div>
      )}

      {children}
    </>
  );
}