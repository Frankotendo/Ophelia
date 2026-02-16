
import React, { useState, useRef, useEffect } from 'react';
import { getTutorResponseStream, getTutorSpeech, playAudioBase64, syncStopAudio } from '../services/gemini';
import { ChatMessage } from '../types';
import { supabase } from '../services/supabase';
import AIBreathingOrb from './AIBreathingOrb';

interface ExtendedChatMessage extends ChatMessage {
  grounding?: any[];
}

interface ChatInterfaceProps {
  prefillMessage?: string;
  onCurriculumLoad?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ prefillMessage, onCurriculumLoad }) => {
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([
    { role: 'model', content: "Dr. Efua Mensah here. I am ready for our academic consultation. What technical area of the CoE curriculum shall we analyze?", timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [aiState, setAiState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [currentModelText, setCurrentModelText] = useState('');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioQueue = useRef<string[]>([]);
  const isPlayingAudio = useRef(false);
  const lastProcessedIdx = useRef(0);

  useEffect(() => {
    if (prefillMessage && !isLoading) {
      handleSend(prefillMessage);
    }
    return () => {
      syncStopAudio();
      audioQueue.current = [];
    };
  }, [prefillMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentModelText]);

  const processAudioQueue = async () => {
    if (isPlayingAudio.current || audioQueue.current.length === 0) {
      if (audioQueue.current.length === 0 && !isLoading) setAiState('idle');
      return;
    }
    
    isPlayingAudio.current = true;
    setAiState('speaking');

    const nextText = audioQueue.current.shift();
    if (nextText) {
      try {
        const speechResult = await getTutorSpeech(nextText);
        if (speechResult?.audioData) {
          const source = await playAudioBase64(speechResult.audioData);
          source.onended = () => {
            isPlayingAudio.current = false;
            processAudioQueue();
          };
        } else {
          isPlayingAudio.current = false;
          processAudioQueue();
        }
      } catch (e) {
        isPlayingAudio.current = false;
        processAudioQueue();
      }
    } else {
      isPlayingAudio.current = false;
      setAiState('idle');
    }
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isLoading) return;

    syncStopAudio();
    audioQueue.current = [];
    isPlayingAudio.current = false;
    lastProcessedIdx.current = 0;

    if (!messageText) setInput('');
    setMessages(prev => [...prev, { role: 'user', content: textToSend, timestamp: Date.now() }]);
    setIsLoading(true);
    setAiState('thinking');
    setCurrentModelText('');

    const history = messages.slice(-6).map(m => ({
      role: m.role,
      parts: [{ text: m.content }]
    }));

    let accumulatedResponse = "";

    try {
      await getTutorResponseStream(textToSend, history, async (chunk) => {
        accumulatedResponse += chunk;
        
        const cleanDisplay = accumulatedResponse.replace(/\[ADD_COURSE:[\s\S]*?\]/, '').trim();
        setCurrentModelText(cleanDisplay);

        // Smart Chunking Logic: Split by major professional pauses
        const sentences = cleanDisplay.split(/(?<=[.!?])\s+/);
        if (sentences.length > lastProcessedIdx.current + 1) {
          for (let i = lastProcessedIdx.current; i < sentences.length - 1; i++) {
            const sentence = sentences[i].trim();
            if (sentence.length > 3) {
              audioQueue.current.push(sentence);
              if (!isPlayingAudio.current) processAudioQueue();
            }
            lastProcessedIdx.current++;
          }
        }
      });

      // Handle terminal text
      const finalDisplay = accumulatedResponse.replace(/\[ADD_COURSE:[\s\S]*?\]/, '').trim();
      const sentences = finalDisplay.split(/(?<=[.!?])\s+/);
      const lastSentence = sentences[sentences.length - 1]?.trim();
      if (lastSentence && lastSentence.length > 1) {
        audioQueue.current.push(lastSentence);
        if (!isPlayingAudio.current) processAudioQueue();
      }

      // Check for curriculum triggers
      const addCourseMatch = accumulatedResponse.match(/\[ADD_COURSE: (\{[\s\S]*?\})\]/);
      if (addCourseMatch) {
        try {
          const courseData = JSON.parse(addCourseMatch[1]);
          await supabase.from('custom_curriculum').insert({
            id: `dyn-${Date.now()}`,
            ...courseData
          });
          if (onCurriculumLoad) onCurriculumLoad();
        } catch (e) {}
      }

      setMessages(prev => [...prev, { 
        role: 'model', 
        content: finalDisplay, 
        timestamp: Date.now() 
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: "I apologize, Student Teacher. My neural uplink encountered a disruption. Let's resume the consultation.", 
        timestamp: Date.now() 
      }]);
    } finally {
      setCurrentModelText('');
      setIsLoading(false);
      if (audioQueue.current.length === 0) setAiState('idle');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full bg-[#0a0c14] rounded-[2rem] sm:rounded-[3.5rem] shadow-2xl overflow-hidden border border-white/5 relative">
      
      {/* Left Panel: Neural Orb Visualizer */}
      <div className="w-full lg:w-1/3 p-8 lg:p-12 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-black border-b lg:border-b-0 lg:border-r border-white/5">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">Lecturer Intel Core</h2>
          <p className="text-[9px] font-bold text-blue-500 uppercase tracking-[0.3em] mt-1">Dr. Efua Mensah • Node Activated</p>
        </div>
        
        <AIBreathingOrb state={aiState} />

        <div className="mt-12 w-full space-y-4">
           <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Signal Protocol</p>
              <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${aiState !== 'idle' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></div>
                 <p className="text-[10px] text-white font-mono uppercase">{aiState === 'idle' ? 'Standby' : aiState}</p>
              </div>
           </div>
           <div className="flex items-center justify-between text-[8px] font-black text-slate-600 uppercase tracking-widest px-2">
              <span>NTS-Aligned</span>
              <span>24kHz Audio</span>
           </div>
        </div>
      </div>

      {/* Right Panel: Consultation Log */}
      <div className="flex-1 flex flex-col min-h-0 bg-black/40 relative">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 lg:p-12 space-y-8 custom-scrollbar">
          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[90%] lg:max-w-[80%] p-6 lg:p-8 rounded-3xl text-[13px] leading-relaxed shadow-lg border transition-all ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none border-blue-500 shadow-blue-900/20' 
                  : 'bg-slate-900/80 text-slate-200 rounded-tl-none border-white/10'
              }`}>
                <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
                {msg.role === 'model' && (
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Academic Response Vector</span>
                    <i className="fas fa-certificate text-blue-500 text-[10px]"></i>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {currentModelText && (
            <div className="flex justify-start">
              <div className="max-w-[90%] lg:max-w-[80%] p-6 lg:p-8 bg-slate-900/80 text-slate-200 rounded-3xl rounded-tl-none border border-white/10 shadow-lg animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="whitespace-pre-wrap font-medium">{currentModelText}</div>
              </div>
            </div>
          )}

          {isLoading && !currentModelText && (
            <div className="flex justify-start">
               <div className="bg-slate-900/50 border border-white/5 px-6 py-4 rounded-2xl flex items-center gap-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Synthesizing Pedagogical Analysis...</p>
               </div>
            </div>
          )}
        </div>

        {/* Tactical Input Area */}
        <div className="p-6 lg:p-12 border-t border-white/5 bg-black/60 backdrop-blur-xl">
          <div className="flex gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              onFocus={() => setAiState('listening')}
              onBlur={() => !isLoading && setAiState('idle')}
              placeholder="Submit your academic inquiry to Dr. Efua Mensah..."
              className="flex-1 px-8 py-5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-sm text-white placeholder:text-slate-600 shadow-inner"
            />
            <button 
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className={`w-16 h-16 lg:w-20 lg:h-20 rounded-2xl transition-all shadow-xl flex items-center justify-center group ${
                isLoading || !input.trim() 
                  ? 'bg-slate-800 text-slate-600' 
                  : 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95 shadow-blue-500/20'
              }`}
            >
              <i className={`fas ${isLoading ? 'fa-dna fa-spin' : 'fa-bolt'} text-2xl`}></i>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default ChatInterface;
