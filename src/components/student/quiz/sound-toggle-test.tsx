'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';
import { useSoundManager } from '@/hooks/use-sound-manager';

/**
 * Simple test component to debug sound toggle functionality
 */
export function SoundToggleTest() {
  const { isMuted, toggleMute } = useSoundManager();

  const handleClick = () => {
    console.log('🔊 Test button clicked, current state:', isMuted);
    toggleMute();
    console.log('🔊 Test button toggleMute called');
  };

  // Force re-render to show current state
  const [renderKey, setRenderKey] = React.useState(0);
  React.useEffect(() => {
    setRenderKey(prev => prev + 1);
  }, [isMuted]);

  const Icon = isMuted ? VolumeX : Volume2;
  const label = isMuted ? 'Unmute sounds' : 'Mute sounds';

  return (
    <div key={renderKey} className="p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-semibold mb-4">Sound Toggle Test</h3>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Current state: {isMuted ? 'Muted' : 'Unmuted'}</p>
          <p className="text-xs text-muted-foreground">Render key: {renderKey}</p>
        </div>
        <Button
          onClick={handleClick}
          className="gap-2"
          variant="outline"
        >
          <Icon className="h-4 w-4" />
          {label}
        </Button>
        <div className="text-xs text-muted-foreground">
          <p>Check console for debug logs</p>
        </div>
      </div>
    </div>
  );
}
