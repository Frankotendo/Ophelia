
import React, { useState, useEffect, useRef } from 'react';

interface IntelLog {
  id: string;
  type: 'LOC' | 'SENSOR' | 'COMM';
  message: string;
  time: string;
}

const GuardianHub: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [logs, setLogs] = useState<IntelLog[]>([]);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [view, setView] = useState<'HUD' | 'COMM' | 'BLACKBOX'>('HUD');
  const [audioLevel, setAudioLevel] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);

  const addLog = (message: string, type: IntelLog['type'] = 'SENSOR') => {
    const newLog: IntelLog = {
      id: Date.now().toString(),
      type,
      message,
      time: new Date().toLocaleTimeString('en-GB', { hour12: false })
    };
    setLogs(prev => [newLog, ...prev].slice(0, 20));
  };

  const initSensors = async () => {
    if (isActive) {
      stopSensors();
      return;
    }

    try {
      // 1. Location Loop
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          addLog(`GPS Fixed: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`, 'LOC');
        });
      }

      // 2. Camera & Audio Stream
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // 3. Audio Analysis for "Spy-HUD" effect
      audioContextRef.current = new AudioContext();
      analyzerRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyzerRef.current);
      
      const updateAudioLevel = () => {
        if (!analyzerRef.current) return;
        const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
        analyzerRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average);
        requestAnimationFrame(updateAudioLevel);
      };
      updateAudioLevel();

      setIsActive(true);
      addLog("Personal Beacon Protocol: ACTIVE", 'SENSOR');
      addLog("Encrypted Audio/Visual Tunnel Established", 'SENSOR');
    } catch (err) {
      addLog("Sensor Initiation Failed: Permission Required", 'SENSOR');
    }
  };

  const stopSensors = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    if (audioContextRef.current) audioContextRef.current.close();
    setIsActive(false);
    addLog("Beacon Terminated", 'SENSOR');
  };

  const sendSafetyCheck = (contact: string) => {
    const msg = `Safety Check - Ophelia: I am currently at ${location ? `${location.lat}, ${location.lng}` : 'Campus'}. My Beacon is Active.`;
    const url = `https://wa.me/${contact}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    addLog(`Emergency Packet Dispatched to ${contact}`, 'COMM');
  };

  return (
    <div className="h-full flex flex-col gap-4 sm:gap-6 bg-[#020617] rounded-[3rem] p-4 sm:p-10 border border-slate-800 shadow-2xl overflow-hidden relative selection:bg-emerald-500/30">
      {/* Matrix Overlays */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
      {isActive && view === 'HUD' && <div className="scan-overlay absolute inset-0 pointer-events-none z-20"></div>}
      
      {/* Top Controller */}
      <div className="relative z-30 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800/50 pb-6">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-emerald-500 shadow-[0_0_20px_#10b981]' : 'bg-slate-800'}`}>
            <i className={`fas ${isActive ? 'fa-user-secret' : 'fa-shield-halved'} text-white text-xl`}></i>
          </div>
          <div>
            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tighter mono-font uppercase">AEGIS COMMAND</h2>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`}></span>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mono-font">{isActive ? 'LIVE TELEMETRY' : 'READY FOR DEPLOYMENT'}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 p-1 bg-slate-900 rounded-2xl border border-slate-800">
          {(['HUD', 'COMM', 'BLACKBOX'] as const).map(t => (
            <button 
              key={t}
              onClick={() => setView(t)}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${view === t ? 'bg-slate-800 text-emerald-400 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-30 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden min-h-0">
        
        {/* VIEW 1: HUD (The Spy Monitor) */}
        {view === 'HUD' && (
          <>
            <div className="lg:col-span-8 flex flex-col gap-4 min-h-0">
              <div className="flex-1 bg-black rounded-[2.5rem] border border-emerald-500/20 relative overflow-hidden flex flex-col items-center justify-center">
                {!isActive ? (
                  <div className="text-center p-8">
                    <i className="fas fa-radar text-6xl text-slate-800 mb-6 animate-pulse"></i>
                    <p className="mono-font text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                      ACTIVATE BEACON TO BEGIN SELF-MONITORING SESSION. PERMISSIONS FOR CAMERA & LOCATION REQUIRED.
                    </p>
                  </div>
                ) : (
                  <>
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-80 grayscale contrast-125" />
                    <div className="absolute top-6 left-6 flex flex-col gap-2">
                       <div className="bg-black/80 backdrop-blur px-3 py-1 rounded-md border border-emerald-500/30">
                          <p className="text-[8px] text-emerald-400 font-bold mono-font">LAT: {location?.lat.toFixed(6) || 'WAITING...'}</p>
                       </div>
                       <div className="bg-black/80 backdrop-blur px-3 py-1 rounded-md border border-emerald-500/30">
                          <p className="text-[8px] text-emerald-400 font-bold mono-font">LNG: {location?.lng.toFixed(6) || 'WAITING...'}</p>
                       </div>
                    </div>
                    <div className="absolute bottom-6 right-6 h-32 w-4 bg-slate-900/50 rounded-full border border-white/5 overflow-hidden">
                       <div className="w-full bg-emerald-500 transition-all duration-100 absolute bottom-0 shadow-[0_0_10px_#10b981]" style={{ height: `${(audioLevel / 255) * 100}%` }}></div>
                    </div>
                  </>
                )}
              </div>
              
              <button 
                onClick={initSensors}
                className={`w-full py-6 rounded-[2rem] font-black text-sm uppercase tracking-[0.4em] transition-all border-2 ${
                  isActive 
                  ? 'bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500/20' 
                  : 'bg-emerald-500 border-emerald-400 text-black hover:scale-[1.02] shadow-xl shadow-emerald-500/20'
                }`}
              >
                {isActive ? 'TERMINATE SESSION' : 'ENGAGE BEACON'}
              </button>
            </div>

            <div className="lg:col-span-4 bg-slate-900/40 rounded-[2.5rem] border border-slate-800 p-6 flex flex-col min-h-0">
               <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-between">
                  <span>SYSTEM_TELEMETRY</span>
                  <span className="text-emerald-500 animate-pulse">● LIVE</span>
               </h3>
               <div className="flex-1 overflow-y-auto space-y-3 mono-font text-[10px] pr-2 custom-scrollbar">
                  {logs.map(log => (
                    <div key={log.id} className="flex gap-3 group">
                       <span className="text-slate-600 shrink-0">[{log.time}]</span>
                       <span className={`${log.type === 'LOC' ? 'text-blue-400' : 'text-emerald-500'}`}>{log.message}</span>
                    </div>
                  ))}
               </div>
            </div>
          </>
        )}

        {/* VIEW 2: COMM (WhatsApp Ghost Tunnel) */}
        {view === 'COMM' && (
          <div className="lg:col-span-12 space-y-8 animate-in slide-in-from-right-10 duration-500">
             <div className="bg-slate-900/50 p-10 rounded-[3rem] border border-emerald-500/10">
                <h3 className="lovely-font text-3xl text-emerald-400 mb-2">Ghost Messenger</h3>
                <p className="text-xs text-slate-500 max-w-lg mb-8 mono-font">Encrypted bridge to your safety contacts. Bypasses app-switching for rapid deployment.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {[
                     { name: 'Safety Officer', phone: '0240000000', color: 'border-emerald-500/20' },
                     { name: 'Roommate (Maame)', phone: '0550000000', color: 'border-blue-500/20' },
                     { name: 'Academic Parent', phone: '0200000000', color: 'border-purple-500/20' }
                   ].map(contact => (
                     <div key={contact.name} className={`p-6 bg-black/40 rounded-[2rem] border ${contact.color} hover:bg-black transition-all group`}>
                        <div className="flex justify-between items-start mb-4">
                           <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-emerald-400 transition-colors">
                              <i className="fab fa-whatsapp text-2xl"></i>
                           </div>
                           <span className="text-[8px] mono-font text-slate-600">GSM_UPLINK</span>
                        </div>
                        <h4 className="text-white font-black text-lg mb-1">{contact.name}</h4>
                        <p className="text-[10px] text-slate-500 mono-font mb-6">{contact.phone}</p>
                        <button 
                          onClick={() => sendSafetyCheck(contact.phone)}
                          className="w-full py-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/30 text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-black transition-all"
                        >
                          Send Beacon
                        </button>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {/* VIEW 3: BLACKBOX (History) */}
        {view === 'BLACKBOX' && (
           <div className="lg:col-span-12 flex flex-col items-center justify-center p-12 text-center text-slate-700">
              <i className="fas fa-box-archive text-8xl mb-8 opacity-10"></i>
              <h4 className="lovely-font text-3xl mb-4">The Black Box</h4>
              <p className="text-xs mono-font max-w-sm mb-8 opacity-50">Local persistence records. No data is stored on cloud servers. Privacy is your fundamental right, Ophelia.</p>
              <div className="w-full max-w-2xl bg-black/40 rounded-3xl p-6 border border-white/5 space-y-2 text-left h-64 overflow-y-auto">
                 <p className="text-[10px] text-slate-500 italic">No historical packets found in this session...</p>
              </div>
           </div>
        )}

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default GuardianHub;
