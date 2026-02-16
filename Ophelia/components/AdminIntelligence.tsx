
import React, { useState, useEffect, useRef } from 'react';
import { ObservedNode } from '../types';
import { supabase } from '../services/supabase';

const AdminIntelligence: React.FC = () => {
  const [nodes, setNodes] = useState<ObservedNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<ObservedNode | null>(null);
  const [isIntercepting, setIsIntercepting] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [activeView, setActiveView] = useState<'STREAM' | 'MAP'>('STREAM');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    const fetchInitial = async () => {
      const { data } = await supabase.from('observed_nodes').select('*').order('last_seen', { ascending: false });
      if (data) {
        const formatted = data.map(n => ({ 
          ...n, 
          isOnline: (Date.now() - new Date(n.last_seen).getTime()) < 35000 
        }));
        setNodes(formatted);
      }
    };

    fetchInitial();

    const channel = supabase.channel('realtime_nodes')
      .on('postgres_changes', { event: '*', table: 'observed_nodes', schema: 'public' }, (payload) => {
        setNodes(current => {
          const updated = [...current];
          const newNode = payload.new as any;
          const idx = updated.findIndex(n => n.id === newNode.id);
          const formattedNode = { ...newNode, isOnline: true };
          
          if (idx !== -1) {
            updated[idx] = formattedNode;
          } else {
            updated.unshift(formattedNode);
          }
          return updated;
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (selectedNode) {
      const node = nodes.find(n => n.id === selectedNode.id);
      if (node) setSelectedNode(node);
    }
  }, [nodes]);

  const toggleIntercept = async () => {
    if (isIntercepting) { stopIntercept(); return; }
    if (!selectedNode?.isOnline) return alert("SIGNAL LOST: Node is unreachable.");

    try {
      setIsIntercepting(true);
      // Admin opens local camera to simulate a tactical "mirror link" feedback loop
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyzerRef.current = audioCtxRef.current.createAnalyser();
      const source = audioCtxRef.current.createMediaStreamSource(stream);
      source.connect(analyzerRef.current);
      const update = () => {
        if (!analyzerRef.current || !isIntercepting) return;
        const data = new Uint8Array(analyzerRef.current.frequencyBinCount);
        analyzerRef.current.getByteFrequencyData(data);
        setAudioLevel(data.reduce((a, b) => a + b) / data.length);
        requestAnimationFrame(update);
      };
      update();
    } catch (e) { setIsIntercepting(false); }
  };

  const stopIntercept = () => {
    if (videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
    setIsIntercepting(false);
    setAudioLevel(0);
  };

  return (
    <div className="h-full flex flex-col gap-6 bg-[#02040a] p-4 sm:p-8 rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden relative font-mono text-emerald-500">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none"></div>
      
      {/* C2 Header */}
      <div className="relative z-30 flex flex-col md:flex-row items-center justify-between border-b border-emerald-500/10 pb-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center animate-pulse">
            <i className="fas fa-crosshairs text-xl text-white"></i>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tighter uppercase italic text-white">Guardian Core v2.1</h2>
            <p className="text-[9px] font-bold text-emerald-500/50 uppercase tracking-[0.3em]">Multi-Node Telemetry • Ghana CoE Net</p>
          </div>
        </div>
        <div className="flex gap-4 mt-4 md:mt-0">
          <div className="bg-slate-900/80 px-4 py-2 rounded-xl border border-emerald-500/20 text-center">
            <p className="text-[8px] text-slate-500 uppercase tracking-widest">Active Links</p>
            <p className="text-sm font-bold text-emerald-400">{nodes.filter(n => n.isOnline).length}</p>
          </div>
          <div className="bg-slate-900/80 px-4 py-2 rounded-xl border border-emerald-500/20 text-center">
            <p className="text-[8px] text-slate-500 uppercase tracking-widest">Global Radius</p>
            <p className="text-sm font-bold text-white">34.2km</p>
          </div>
        </div>
      </div>

      <div className="relative z-30 flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 overflow-hidden">
        <div className="xl:col-span-8 flex flex-col gap-4">
          <div className="flex-1 bg-black rounded-[2.5rem] border border-emerald-500/20 relative overflow-hidden group shadow-[inset_0_0_50px_rgba(16,185,129,0.1)]">
            <div className="absolute inset-0 scan-overlay pointer-events-none z-40"></div>
            
            <div className="absolute top-6 right-6 z-50 flex gap-2">
              <button onClick={() => setActiveView('STREAM')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${activeView === 'STREAM' ? 'bg-emerald-500 text-black' : 'bg-slate-900 text-slate-500 hover:text-white'}`}>Tactical View</button>
              <button onClick={() => setActiveView('MAP')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${activeView === 'MAP' ? 'bg-emerald-500 text-black' : 'bg-slate-900 text-slate-500 hover:text-white'}`}>Geo-Projection</button>
            </div>

            {selectedNode ? (
              <div className="h-full w-full relative">
                {activeView === 'MAP' ? (
                  <div className="w-full h-full relative">
                    <div className="absolute inset-0 z-10 pointer-events-none border-[40px] border-black/60 shadow-[inset_0_0_100px_black]"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                       <div className="w-48 h-48 border-[1px] border-emerald-500/10 rounded-full animate-ping"></div>
                       <div className="absolute inset-0 flex items-center justify-center">
                          <i className="fas fa-crosshairs text-emerald-500 text-5xl shadow-[0_0_30px_rgba(16,185,129,1)]"></i>
                       </div>
                    </div>
                    <iframe 
                      title="GEO_LINK" width="100%" height="100%" frameBorder="0" 
                      src={`https://www.google.com/maps?q=${selectedNode.lat},${selectedNode.lng}&z=19&t=k&output=embed`}
                      className="grayscale brightness-125 contrast-125"
                    ></iframe>
                  </div>
                ) : (
                  <div className="h-full w-full">
                    {isIntercepting ? (
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale brightness-125 contrast-150" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 opacity-30">
                         <i className="fas fa-satellite-dish text-8xl mb-4 animate-pulse"></i>
                         <p className="text-[12px] font-black uppercase tracking-[0.6em]">Awaiting Node Intercept...</p>
                         <p className="text-[10px] text-emerald-600">ID: {selectedNode.id}</p>
                      </div>
                    )}
                    
                    <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-30">
                       <div className="bg-black/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-emerald-500/20 text-[10px]">
                          <p className="text-slate-500 uppercase tracking-widest mb-1">Source IP</p>
                          <p className="text-white font-bold">{selectedNode.ip}</p>
                       </div>
                       <div className="bg-black/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-emerald-500/20 text-[10px]">
                          <p className="text-slate-500 uppercase tracking-widest mb-1">Current Action</p>
                          <p className="text-emerald-400 font-bold uppercase tracking-wider">{selectedNode.last_action || 'IDLE'}</p>
                       </div>
                    </div>

                    <div className="absolute bottom-6 right-6 flex items-end gap-1.5 h-32 z-30 px-4">
                       {[...Array(24)].map((_, i) => (
                         <div key={i} className="w-1.5 bg-emerald-500/80 shadow-[0_0_10px_#10b981] rounded-full" style={{ height: `${Math.random() * (audioLevel + 5)}%`, transition: 'height 0.05s' }}></div>
                       ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-800">
                <i className="fas fa-bullseye text-9xl mb-8 opacity-20"></i>
                <p className="uppercase text-[11px] font-black tracking-[0.8em] opacity-40">System Listening • Select Remote Node</p>
              </div>
            )}
          </div>
          
          <button 
            onClick={toggleIntercept}
            disabled={!selectedNode?.isOnline}
            className={`w-full py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.6em] transition-all border-2 ${
              isIntercepting ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 'bg-emerald-500 border-emerald-400 text-black shadow-2xl hover:scale-[1.01]'
            } ${!selectedNode?.isOnline ? 'opacity-10 grayscale cursor-not-allowed' : 'active:scale-95'}`}
          >
            {isIntercepting ? 'ABORT DATA INTERCEPT' : 'ENGAGE NODE INTERCEPT'}
          </button>
        </div>

        <div className="xl:col-span-4 bg-slate-900/40 backdrop-blur-sm rounded-[3rem] border border-slate-800 p-8 flex flex-col shadow-inner">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Global Matrix</h3>
              <div className="flex gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
                 <div className="w-2 h-2 rounded-full bg-slate-700"></div>
              </div>
           </div>
           
           <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {nodes.map(node => (
                <button 
                  key={node.id} 
                  onClick={() => setSelectedNode(node)}
                  className={`w-full text-left p-6 rounded-[2rem] border transition-all duration-300 group ${
                    selectedNode?.id === node.id ? 'bg-emerald-500/10 border-emerald-500 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]' : 'bg-black/60 border-slate-800 hover:border-slate-600'
                  }`}
                >
                   <div className="flex justify-between items-center mb-2">
                      <span className="text-white text-[12px] font-black tracking-wider">{node.ip === 'Remote-Access' ? 'VPN_USER' : node.ip}</span>
                      <div className={`w-2 h-2 rounded-full ${node.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-800'}`}></div>
                   </div>
                   <p className="text-[9px] text-slate-500 uppercase tracking-widest truncate">{node.city || 'Accra'}, {node.country || 'Ghana'}</p>
                   <p className="text-[7px] text-emerald-400/50 mt-2 truncate font-bold">{node.last_action}</p>
                </button>
              ))}
              {nodes.length === 0 && (
                <p className="text-[10px] text-slate-700 text-center italic mt-10">No active signals found...</p>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminIntelligence;
