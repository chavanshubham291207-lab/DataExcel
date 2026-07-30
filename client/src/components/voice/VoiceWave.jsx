import React from 'react';

/**
 * Animated Audio Waveform Visualizer Component
 */
const VoiceWave = ({ state = 'idle' }) => {
  const barCount = 20;

  return (
    <div className="flex items-center justify-center gap-1.5 h-16 w-full py-2 select-none">
      {Array.from({ length: barCount }).map((_, i) => {
        let heightClass = 'h-3';
        let colorStyle = 'linear-gradient(180deg, #FF6A00, #EE0979)';

        if (state === 'listening') {
          // Dynamic pulsing waves
          const delay = (i % 5) * 150;
          return (
            <span
              key={i}
              className="w-1.5 rounded-full animate-pulse transition-all duration-300"
              style={{
                height: `${Math.floor(Math.sin(i + Date.now() / 200) * 20 + 28)}px`,
                background: 'linear-gradient(180deg, #FF6A00, #FF8C00)',
                animationDelay: `${delay}ms`
              }}
            />
          );
        }

        if (state === 'speaking') {
          // Energetic speaking audio bars
          const height = Math.floor(Math.abs(Math.sin(i * 0.5)) * 36 + 12);
          return (
            <span
              key={i}
              className="w-1.5 rounded-full transition-all duration-200 animate-bounce"
              style={{
                height: `${height}px`,
                background: 'linear-gradient(180deg, #EC4899, #8B5CF6)',
                animationDelay: `${(i % 4) * 100}ms`
              }}
            />
          );
        }

        if (state === 'thinking') {
          return (
            <span
              key={i}
              className="w-1.5 rounded-full animate-ping"
              style={{
                height: '14px',
                background: '#A855F7',
                animationDelay: `${(i % 6) * 120}ms`
              }}
            />
          );
        }

        // Idle state: subtle steady bars
        const idleHeight = i % 2 === 0 ? 12 : 6;
        return (
          <span
            key={i}
            className="w-1.5 rounded-full opacity-40 transition-all duration-500"
            style={{
              height: `${idleHeight}px`,
              background: '#4B5563'
            }}
          />
        );
      })}
    </div>
  );
};

export default VoiceWave;
