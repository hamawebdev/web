'use client';

import { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { SoundContext } from '@/components/student/quiz/sound-provider';

export type SoundType = 'correct' | 'incorrect';

interface SoundManagerState {
  isMuted: boolean;
  isPlaying: boolean;
}

interface SoundManagerReturn {
  isMuted: boolean;
  isPlaying: boolean;
  toggleMute: () => void;
  playSound: (type: SoundType) => Promise<void>;
  setMuted: (muted: boolean) => void;
}

const STORAGE_KEY = 'quiz-sound-settings';
const SOUND_FILES = {
  correct: '/correct.mp3',
  incorrect: '/incorrect.mp3',
} as const;

/**
 * Custom hook for managing quiz answer feedback sounds
 * Features:
 * - Mute/unmute functionality with localStorage persistence
 * - Sound overlap prevention
 * - Error handling for missing sound files
 * - Default unmuted state
 */
export function useSoundManager(): SoundManagerReturn {
  // Prefer shared context if available (prevents stale state across components)
  const ctx = useContext(SoundContext);
  if (ctx) return ctx;

  const [state, setState] = useState<SoundManagerState>({
    isMuted: false, // Default to unmuted
    isPlaying: false,
  });

  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCache = useRef<Map<SoundType, HTMLAudioElement>>(new Map());

  // Load mute state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const settings = JSON.parse(stored);
        const isMuted = Boolean(settings.isMuted);
        setState(prev => ({
          ...prev,
          isMuted: isMuted,
        }));
      } else {
      }
    } catch (error) {
      console.warn('Failed to load sound settings from localStorage:', error);
      // Keep default unmuted state
    }
  }, []);

  // Preload audio files and cache them
  useEffect(() => {
    const preloadAudio = () => {
      Object.entries(SOUND_FILES).forEach(([type, src]) => {
        try {
          const audio = new Audio(src);
          audio.preload = 'auto';
          audio.volume = 0.7; // Set reasonable volume
          
          // Handle load errors silently
          audio.addEventListener('error', () => {
            console.warn(`Failed to load sound file: ${src}`);
          });

          audioCache.current.set(type as SoundType, audio);
        } catch (error) {
          console.warn(`Failed to create audio element for ${type}:`, error);
        }
      });
    };

    preloadAudio();

    // Cleanup on unmount
    return () => {
      audioCache.current.forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      audioCache.current.clear();
    };
  }, []);

  // Save mute state to localStorage
  const saveMuteState = useCallback((isMuted: boolean) => {
    try {
      const settings = { isMuted };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save sound settings to localStorage:', error);
      // Continue without localStorage - the state will still work in memory
    }
  }, []);

  // Toggle mute state
  const toggleMute = useCallback(() => {
    
    setState(prev => {
      const newMuted = !prev.isMuted;
      
      // Save to localStorage immediately
      saveMuteState(newMuted);

      // Stop any currently playing sound when muting
      if (newMuted && currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
      }

      const newState = {
        ...prev,
        isMuted: newMuted,
        isPlaying: newMuted ? false : prev.isPlaying,
      };
      
      
      // Force a re-render by using a new object reference
      return { ...newState };
    });
  }, [saveMuteState]);

  // Set mute state directly
  const setMuted = useCallback((muted: boolean) => {
    setState(prev => {
      if (prev.isMuted === muted) return prev;
      
      saveMuteState(muted);
      
      // Stop any currently playing sound when muting
      if (muted && currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
      }
      
      const newState = {
        ...prev,
        isMuted: muted,
        isPlaying: muted ? false : prev.isPlaying,
      };
      
      // Force a re-render by using a new object reference
      return { ...newState };
    });
  }, [saveMuteState]);

  // Play sound with overlap prevention
  const playSound = useCallback(async (type: SoundType): Promise<void> => {
    // Don't play if muted
    if (state.isMuted) {
      return;
    }

    try {
      // Stop any currently playing sound to prevent overlap
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      }

      // Get cached audio element
      const audio = audioCache.current.get(type);
      if (!audio) {
        console.warn(`Audio not found for type: ${type}`);
        return;
      }

      // Reset audio to beginning
      audio.currentTime = 0;
      currentAudioRef.current = audio;

      setState(prev => ({ ...prev, isPlaying: true }));

      // Play the sound
      await audio.play();

      // Set up event listeners for this playback
      const handleEnded = () => {
        setState(prev => ({ ...prev, isPlaying: false }));
        if (currentAudioRef.current === audio) {
          currentAudioRef.current = null;
        }
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
      };

      const handleError = () => {
        setState(prev => ({ ...prev, isPlaying: false }));
        if (currentAudioRef.current === audio) {
          currentAudioRef.current = null;
        }
        console.warn(`Error playing sound: ${type}`);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
      };

      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);

    } catch (error) {
      setState(prev => ({ ...prev, isPlaying: false }));
      currentAudioRef.current = null;
      console.warn(`Failed to play sound ${type}:`, error);
      // Silently fail - don't block answer submission
    }
  }, [state.isMuted]);


  return {
    isMuted: state.isMuted,
    isPlaying: state.isPlaying,
    toggleMute,
    playSound,
    setMuted,
  };
}
