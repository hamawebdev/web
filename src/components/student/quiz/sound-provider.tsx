"use client";

import React, { createContext, useCallback, useEffect, useRef, useState } from "react";

// Keep types local to avoid circular deps
export type SoundType = "correct" | "incorrect";

export interface SoundContextValue {
  isMuted: boolean;
  isPlaying: boolean;
  toggleMute: () => void;
  playSound: (type: SoundType) => Promise<void>;
  setMuted: (muted: boolean) => void;
}

export const SoundContext = createContext<SoundContextValue | null>(null);

const STORAGE_KEY = "quiz-sound-settings";
const SOUND_FILES: Record<SoundType, string> = {
  correct: "/correct.mp3",
  incorrect: "/incorrect.mp3",
};

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(false); // default unmuted
  const [isPlaying, setIsPlaying] = useState(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCache = useRef<Map<SoundType, HTMLAudioElement>>(new Map());

  // Initialize from localStorage once on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const settings = JSON.parse(stored);
        setIsMuted(Boolean(settings.isMuted));
      }
    } catch (e) {
      // Ignore and keep defaults
    }
  }, []);

  // Preload audio once
  useEffect(() => {
    Object.entries(SOUND_FILES).forEach(([key, src]) => {
      try {
        const audio = new Audio(src);
        audio.preload = "auto";
        audio.volume = 0.7;
        audio.addEventListener("error", () => {
          console.warn(`Failed to load sound file: ${src}`);
        });
        audioCache.current.set(key as SoundType, audio);
      } catch (e) {
        console.warn(`Failed to create audio element for ${key}:`, e);
      }
    });

    return () => {
      audioCache.current.forEach((audio) => {
        audio.pause();
        audio.src = "";
      });
      audioCache.current.clear();
    };
  }, []);

  const saveMuteState = useCallback((muted: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ isMuted: muted }));
    } catch (e) {
      // Non-fatal
    }
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    setIsMuted((prev) => {
      if (prev === muted) return prev;
      saveMuteState(muted);
      if (muted && currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
      }
      return muted;
    });
  }, [saveMuteState]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      saveMuteState(next);
      if (next && currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
      }
      return next;
    });
  }, [saveMuteState]);

  const playSound = useCallback(async (type: SoundType): Promise<void> => {
    if (isMuted) return;
    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      }
      const audio = audioCache.current.get(type);
      if (!audio) return;
      audio.currentTime = 0;
      currentAudioRef.current = audio;
      setIsPlaying(true);

      await audio.play();

      const handleEnded = () => {
        setIsPlaying(false);
        if (currentAudioRef.current === audio) currentAudioRef.current = null;
        audio.removeEventListener("ended", handleEnded);
        audio.removeEventListener("error", handleError);
      };
      const handleError = () => {
        setIsPlaying(false);
        if (currentAudioRef.current === audio) currentAudioRef.current = null;
        audio.removeEventListener("ended", handleEnded);
        audio.removeEventListener("error", handleError);
      };
      audio.addEventListener("ended", handleEnded);
      audio.addEventListener("error", handleError);
    } catch (e) {
      setIsPlaying(false);
      currentAudioRef.current = null;
    }
  }, [isMuted]);

  const value: SoundContextValue = {
    isMuted,
    isPlaying,
    toggleMute,
    playSound,
    setMuted,
  };

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

