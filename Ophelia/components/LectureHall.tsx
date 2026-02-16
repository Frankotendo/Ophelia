
import React, { useState, useRef, useEffect } from 'react';
import { getTutorResponseStream, getTutorSpeech, playAudioBase64 } from '../services/gemini';
import { Course, JournalEntry } from '../types';

interface BoardItem {
  id: string;
  type: 'header' | 'point';
  content: string;
}

interface LectureHallProps {
  studyTopic?: string;
  onJournalEntry?: (e: JournalEntry) => void;
  onCurriculumLoad?: (newCurriculum: Course[]) => void;
}

const LectureHall: React.FC<LectureHallProps> = ({ studyTopic, onJournalEntry, onCurriculumLoad }) => {
  const [boardItems, setBoardItems] = useState<BoardItem[]>([]);
  const [isTeaching, setIsTeaching] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const lastTopic = useRef<string | null>(null);
  const audioQueue = useRef<string[]>([]);
  const isPlayingAudio = useRef(false);
  const currentAudioSource = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    if (studyTopic && studyTopic !== lastTopic.current) {
      lastTopic.current = studyTopic;
      startStreamingLecture(studyTopic);
    }
    return () => stopAllSpeech();
  }, [studyTopic]);

  const stopAllSpeech = () => {
    if (currentAudioSource.current) {
      try { currentAudioSource.current.stop(); } catch (e) {}
    }
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
      const result = await getTutorSpeech(nextText);
      if (result?.audioData) {
        const source = await playAudioBase64(result.audioData);
        currentAudioSource.current = source;
        
        source.onended = () => {
          isPlayingAudio.current = false;
          currentAudioSource.current = null;
          if (audioQueue.current.length === 0) {
            setIsSpeaking(false);
          }
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

  const startStreamingLecture = async (topic: string) => {
    stopAllSpeech();
    setIsTeaching(true);
    setBoardItems([]);
    setActiveIdx(-1);

    let accumulatedText = "";
    let lastSentenceEnd = 0;

    await getTutorResponseStream(topic, [], (chunk) => {
      accumulatedText += chunk;
      
      const boardMatch = accumulatedText.match(/BEGIN_BOARD([\s\S]*?)END_BOARD/);
      const partialMatch = accumulatedText.match(/BEGIN_BOARD([\s\S]*)$/);
      const rawBoardContent = boardMatch ? boardMatch[1] : (partialMatch ? partialMatch[1] : "");
      
      if (rawBoardContent) {
        const segments = rawBoardContent.trim().split('[SEGMENT]').map(s => s.trim()).filter(s => s.length > 0);
        const newItems: BoardItem[] = segments.map((s, i) => ({
          id: `seg-${i}`,
          type: s.startsWith('#') ? 'header' : 'point',
          content: s.replace('#', '').trim()
        }));
        setBoardItems(newItems);
        if (newItems.length > activeIdx + 1) setActiveIdx(newItems.length - 1);
      }

      const currentSpeechText = accumulatedText.replace(/BEGIN_BOARD[\s\S]*?(END_BOARD|$)/, '');
      const potentialSentences = currentSpeechText.substring(lastSentenceEnd).split(/(?<=[.!?])\s+/);
      
      if (potentialSentences.length > 1) {
        for (let i = 0; i < potentialSentences.length - 1; i++) {
          const sentence = potentialSentences[i].trim();
          if (sentence.length > 5) {
            audioQueue.current.push(sentence);
            processAudioQueue();
          }
          lastSentenceEnd += potentialSentences[i].length + 1;
        }
      }
    });

    setIsTeaching(false);
  };

  const boardStyle = isExpanded 
    ? "fixed inset-0 z-[100] bg-[#1a2a21] border-[16px] border-[#4a3728] shadow-2xl overflow-hidden flex flex-col p-4 sm:p-12 animate-in zoom-in-95 duration-500"
    : "flex-1 bg-[#1a2a21] rounded-[2.5rem] border-[12px] border-[#4a3728] shadow-2xl relative overflow-hidden flex flex-col";

  return (
    <div className={`h-full flex flex-col space-y-6 ${isExpanded ? '' : 'animate-in fade-in duration-700'}`}>
      {!isExpanded && (
        <div className="flex items-center justify-between bg-white rounded-3xl p-5 border border-rose-50 shadow-sm">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg transition-all ${isSpeaking ? 'animate-heart scale-110 shadow-rose-300' : ''}`}>
              <i className={`fas ${isSpeaking ? 'fa-volume-high' : 'fa-hand-holding-heart'} text-lg`}></i>
            </div>
            <div>
              <h1 className="lovely-font text-2xl text-rose-600 leading-none">Auntie's Chalkboard</h1>
              <p className="text-[9px] font-black text-rose-300 uppercase tracking-widest mt-1">
                {isTeaching ? 'Writing with love...' : 'Teaching my precious Ophelia'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsExpanded(true)}
            className="group flex items-center gap-3 px-6 py-2.5 rounded-2xl bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white transition-all shadow-inner font-black text-[10px] uppercase tracking-widest"
          >
            <i className="fas fa-expand-arrows-alt transition-transform group-hover:scale-110"></i>
            Full Care Mode
          </button>
        </div>
      )}

      <div className={boardStyle}>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-10"></div>
        
        {isExpanded && (
          <div className="relative z-20 flex items-center justify-between mb-8 pb-4 border-b border-white/5">
             <div className="flex items-center gap-4">
               <div className={`w-10 h-10 bg-rose-500/20 rounded-full flex items-center justify-center text-rose-400 ${isSpeaking ? 'animate-heart' : ''}`}>
                  <i className="fas fa-heart"></i>
               </div>
               <div>
                 <h2 className="chalk-font text-xl text-white">Focusing on your Future, My Love</h2>
                 <p className="text-[8px] uppercase tracking-[0.3em] text-emerald-400 font-bold">Auntie is speaking • Just for Ophelia</p>
               </div>
             </div>
             <button 
               onClick={() => setIsExpanded(false)}
               className="px-8 py-3 rounded-2xl bg-white/10 text-white hover:bg-rose-600 transition-all font-black text-[10px] uppercase tracking-widest border border-white/10 shadow-lg"
             >
               Return to Hall
             </button>
          </div>
        )}

        <div className="relative z-10 p-4 sm:p-12 overflow-y-auto no-scrollbar flex-1 space-y-8">
           {boardItems.map((item, idx) => (
             <div key={item.id} className={`transition-all duration-1000 ${idx <= activeIdx ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {item.type === 'header' ? (
                  <h3 className={`chalk-font text-yellow-100 text-center py-6 border-b border-white/5 ${isExpanded ? 'text-5xl mb-12' : 'text-3xl mb-4'}`}>{item.content}</h3>
                ) : (
                  <div className="flex gap-6 p-6 hover:bg-white/5 rounded-[2rem] transition-all group relative border border-transparent hover:border-white/5">
                    <span className={`text-pink-300 chalk-font ${isExpanded ? 'text-4xl' : 'text-2xl'}`}>❤</span>
                    <p className={`chalk-font text-white/90 flex-1 leading-relaxed ${isExpanded ? 'text-3xl' : 'text-xl'}`}>
                      {item.content}
                    </p>
                    <button 
                      onClick={() => onJournalEntry?.({ id: Date.now().toString(), title: "Petal of Wisdom", content: item.content, date: new Date().toLocaleDateString(), mood: '💖' })}
                      className="opacity-0 group-hover:opacity-100 transition-all text-rose-400 hover:scale-125 px-4"
                    >
                      <i className="fas fa-heart text-xl"></i>
                    </button>
                  </div>
                )}
             </div>
           ))}
           {boardItems.length === 0 && (
             <div className="h-full flex flex-col items-center justify-center opacity-10">
                <i className="fas fa-heart text-9xl text-white animate-heart"></i>
                <p className="chalk-font text-white mt-8 text-center text-3xl">Auntie is preparing your board, my precious Ophelia...</p>
             </div>
           )}
        </div>
        
        <div className="h-6 w-full bg-[#3e2723] border-t border-black/20 flex items-center justify-around px-24 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.3)]">
           <div className="w-16 h-2 bg-white/90 rounded-sm rotate-2 shadow-sm"></div>
           <div className="w-12 h-2 bg-pink-200/90 rounded-sm -rotate-1 shadow-sm"></div>
           <div className="w-20 h-2 bg-white/80 rounded-sm rotate-3 shadow-sm hidden sm:block"></div>
        </div>
      </div>
      
      <style>{`
        .chalk-font { font-family: 'Gloria Hallelujah', cursive; text-shadow: 2px 2px 4px rgba(0,0,0,0.8); }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 15s linear infinite; }
      `}</style>
    </div>
  );
};

export default LectureHall;
