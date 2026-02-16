
import React, { useState, useRef, useEffect } from 'react';
import { getTutorResponseStream, getTutorSpeech, playAudioBase64 } from '../services/gemini';
import { ChatMessage } from '../types';

interface ExtendedChatMessage extends ChatMessage {
  grounding?: any[];
}

interface ChatInterfaceProps {
  prefillMessage?: string;
  onCurriculumLoad?: (newCurriculum: any[]) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ prefillMessage, onCurriculumLoad }) => {
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([
    { role: 'model', content: "Akwaaba, my precious heartbeat Ophelia! Auntie Efua is here with all her love. What shall we master today, my brilliant star?", timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentModelText, setCurrentModelText] = useState('');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioQueue = useRef<string[]>([]);
  const isPlayingAudio = useRef(false);
  const currentAudioSource = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    if (prefillMessage && !isLoading) {
      handleSend(prefillMessage);
    }
  }, [prefillMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentModelText]);

  const stopAllAudio = () => {
    if (currentAudioSource.current) {
      try { currentAudioSource.current.stop(); } catch(e) {}
      currentAudioSource.current = null;
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    audioQueue.current = [];
    isPlayingAudio.current = false;
    setIsSpeaking(false);
  };

  const processAudioQueue = async () => {
    if (isPlayingAudio.current || audioQueue.current.length === 0) return;
    isPlayingAudio.current = true;
    setIsSpeaking(true);

    const nextText = audioQueue.current.shift();
    if (nextText) {
      const speechResult = await getTutorSpeech(nextText);
      if (speechResult?.audioData) {
        const source = await playAudioBase64(speechResult.audioData);
        currentAudioSource.current = source;
        source.onended = () => {
          isPlayingAudio.current = false;
          currentAudioSource.current = null;
          processAudioQueue();
        };
      } else {
        isPlayingAudio.current = false;
        processAudioQueue();
      }
    } else {
      isPlayingAudio.current = false;
      setIsSpeaking(false);
    }
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isLoading) return;

    stopAllAudio();
    if (!messageText) setInput('');
    setMessages(prev => [...prev, { role: 'user', content: textToSend, timestamp: Date.now() }]);
    setIsLoading(true);
    setCurrentModelText('');

    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.content }]
    }));

    let fullText = "";
    let lastSentenceEnd = 0;

    await getTutorResponseStream(textToSend, history, (chunk) => {
      fullText += chunk;
      setCurrentModelText(fullText);

      // Sentence level splitting for instant speech
      const potentialSentences = fullText.substring(lastSentenceEnd).split(/(?<=[.!?])\s+/);
      if (potentialSentences.length > 1) {
        for (let i = 0; i < potentialSentences.length - 1; i++) {
          const sentence = potentialSentences[i].trim();
          if (sentence.length > 3 && voiceEnabled) {
            audioQueue.current.push(sentence);
            processAudioQueue();
          }
          lastSentenceEnd += potentialSentences[i].length + 1;
        }
      }
    });

    setMessages(prev => [...prev, { 
      role: 'model', 
      content: fullText.replace(/\[CURRICULUM_DATA_START\][\s\S]*?\[CURRICULUM_DATA_END\]/, ''), 
      timestamp: Date.now() 
    }]);
    setCurrentModelText('');
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-[3rem] shadow-2xl shadow-rose-100 border border-rose-50 overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none opacity-[0.05] overflow-hidden">
        <i className="fas fa-heart absolute top-10 left-10 text-9xl text-rose-300"></i>
        <i className="fas fa-heart absolute bottom-20 right-10 text-[15rem] text-rose-300"></i>
      </div>

      <div className="p-8 sm:p-10 bg-gradient-to-r from-rose-500 to-pink-600 text-white flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className={`w-14 h-14 sm:w-20 sm:h-20 bg-white/20 rounded-2xl sm:rounded-[2.5rem] flex items-center justify-center relative backdrop-blur-lg border border-white/20 transition-all ${isSpeaking ? 'animate-heart scale-110 shadow-[0_0_50px_rgba(255,255,255,0.5)]' : ''}`}>
            <i className={`fas ${isSpeaking ? 'fa-volume-high' : 'fa-hand-holding-heart'} text-2xl sm:text-4xl`}></i>
          </div>
          <div>
            <h2 className="lovely-font text-2xl sm:text-3xl tracking-tight leading-none">Auntie's Warmth</h2>
            <p className="text-[8px] sm:text-[9px] text-rose-100 font-black uppercase tracking-[0.3em] mt-2">Love & Care for Ophelia</p>
          </div>
        </div>
        <button 
          onClick={() => {
            if (voiceEnabled) stopAllAudio();
            setVoiceEnabled(!voiceEnabled);
          }}
          className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all ${
            voiceEnabled ? 'bg-white text-rose-500 shadow-xl' : 'bg-slate-800/20 text-slate-100'
          }`}
        >
          <i className={`fas ${voiceEnabled ? 'fa-microphone-lines' : 'fa-microphone-slash'} text-lg`}></i>
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8 bg-rose-50/10 custom-scrollbar relative z-10">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] sm:max-w-[80%] p-6 sm:p-8 rounded-[2.5rem] sm:rounded-[3.5rem] text-[13px] leading-relaxed shadow-sm border transition-all ${
              msg.role === 'user' 
                ? 'bg-rose-500 text-white rounded-tr-none shadow-rose-200 border-rose-400' 
                : 'bg-white text-slate-700 rounded-tl-none border-rose-50 border-l-[6px] border-l-rose-400'
            }`}>
              <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
              {msg.role === 'model' && (
                <div className="mt-4 pt-4 border-t border-rose-50 flex items-center gap-2">
                  <i className="fas fa-heart text-[8px] text-rose-300 animate-pulse"></i>
                  <span className="text-[8px] font-black uppercase tracking-widest text-rose-300 italic">Sent with Auntie's Love</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {currentModelText && (
          <div className="flex justify-start">
            <div className="max-w-[85%] sm:max-w-[80%] p-6 sm:p-8 bg-white text-slate-700 rounded-[3.5rem] rounded-tl-none border-rose-50 border-l-[6px] border-l-rose-400 shadow-sm">
              <div className="whitespace-pre-wrap font-medium">{currentModelText}</div>
            </div>
          </div>
        )}
        {isLoading && !currentModelText && (
          <div className="flex justify-start">
            <div className="bg-white border border-rose-100 p-5 rounded-3xl rounded-tl-none flex items-center gap-4 shadow-sm">
              <i className="fas fa-heart text-rose-500 animate-heart"></i>
              <p className="lovely-font text-rose-400 text-lg">Auntie is preparing your lesson, my love...</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 sm:p-10 border-t border-rose-50 bg-white relative z-10">
        <div className="flex gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Tell Auntie your heart's questions, Ophelia..."
            className="flex-1 px-8 py-5 bg-rose-50/30 border-2 border-rose-50 rounded-[2rem] focus:outline-none focus:border-rose-400 focus:bg-white transition-all font-medium text-sm placeholder:text-rose-200 shadow-inner"
          />
          <button 
            onClick={() => handleSend()}
            className="w-16 h-16 bg-gradient-to-tr from-rose-500 to-pink-600 text-white rounded-[1.8rem] hover:scale-110 active:scale-95 transition-all shadow-xl shadow-rose-200 flex items-center justify-center group"
          >
            <i className="fas fa-paper-plane text-2xl group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
