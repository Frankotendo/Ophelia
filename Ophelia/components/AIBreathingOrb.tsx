
import React from 'react';

interface AIBreathingOrbProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
  intensity?: number; // 0 to 1 for reactivity
}

const AIBreathingOrb: React.FC<AIBreathingOrbProps> = ({ state, intensity = 0 }) => {
  const getGradient = () => {
    switch (state) {
      case 'listening': return 'from-emerald-400 to-blue-500';
      case 'thinking': return 'from-blue-600 to-indigo-600';
      case 'speaking': return 'from-blue-400 to-cyan-400';
      default: return 'from-slate-700 to-slate-900';
    }
  };

  return (
    <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center">
      {/* Outer Glow */}
      <div className={`absolute inset-0 rounded-full bg-gradient-to-tr ${getGradient()} opacity-20 blur-3xl transition-all duration-1000 ${state !== 'idle' ? 'scale-150' : 'scale-100'}`}></div>
      
      {/* Reactive Rings */}
      <div className={`absolute inset-0 rounded-full border-2 border-blue-500/20 transition-transform duration-500 ${state === 'speaking' ? 'animate-ping' : ''}`}></div>
      <div className={`absolute inset-4 rounded-full border border-white/10 ${state === 'thinking' ? 'animate-spin-slow' : ''}`}></div>

      {/* The Core Orb */}
      <div className={`relative w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br ${getGradient()} shadow-[0_0_50px_rgba(59,130,246,0.5)] flex items-center justify-center transition-all duration-500 transform ${state === 'speaking' ? `scale-[${1 + intensity * 0.2}]` : 'scale-100'}`}>
        <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-sm"></div>
        
        {/* State-specific Icons */}
        <div className="relative z-10 text-white text-3xl sm:text-4xl">
          {state === 'listening' && <i className="fas fa-waveform animate-pulse"></i>}
          {state === 'thinking' && <i className="fas fa-brain animate-bounce"></i>}
          {state === 'speaking' && <i className="fas fa-volume-high animate-pulse"></i>}
          {state === 'idle' && <i className="fas fa-user-tie opacity-40"></i>}
        </div>

        {/* Dynamic Waves for Speaking */}
        {state === 'speaking' && (
          <div className="absolute inset-0 flex items-center justify-center opacity-40">
            <div className="w-full h-1 bg-white/50 blur-sm animate-pulse"></div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default AIBreathingOrb;
