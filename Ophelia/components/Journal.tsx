
import React, { useState } from 'react';
import { JournalEntry } from '../types';

interface JournalProps {
  entries: JournalEntry[];
  onSave: (entry: JournalEntry) => void;
}

const Journal: React.FC<JournalProps> = ({ entries, onSave }) => {
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isWriting, setIsWriting] = useState(false);

  const handleSave = () => {
    if (!newContent.trim()) return;
    const entry: JournalEntry = {
      id: Date.now().toString(),
      title: newTitle || 'Reflections of a Future Educator',
      content: newContent,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      mood: '🌸'
    };
    onSave(entry);
    setNewTitle('');
    setNewContent('');
    setIsWriting(false);
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col space-y-4 sm:space-y-8 animate-in fade-in duration-1000">
      <div className="flex items-center justify-between px-2">
        <div>
          <h2 className="lovely-font text-3xl sm:text-5xl text-rose-600">My Secret Garden</h2>
          <p className="text-[8px] sm:text-[10px] font-black text-rose-300 uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-1">Private Reflections • Ophelia's Journey</p>
        </div>
        
        {/* Desktop only button - Mobile uses FAB below */}
        <button 
          onClick={() => setIsWriting(!isWriting)}
          className={`hidden md:block px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95 ${
            isWriting ? 'bg-slate-100 text-slate-500' : 'bg-rose-500 text-white shadow-rose-200'
          }`}
        >
          {isWriting ? 'Close Diary' : 'Write a Petal'}
        </button>
      </div>

      {isWriting ? (
        <div className="bg-white rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-12 shadow-2xl border border-rose-100 animate-in zoom-in-95 duration-500 relative overflow-hidden flex-1 flex flex-col">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
          <div className="space-y-4 sm:space-y-8 relative z-10 flex-1 flex flex-col">
            <input 
              type="text" 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Title of this reflection..."
              className="w-full lovely-font text-2xl sm:text-4xl text-rose-700 border-b-2 border-rose-50 focus:border-rose-300 focus:outline-none pb-2 sm:pb-4 bg-transparent transition-colors"
            />
            <div className="relative flex-1">
              <div className="absolute inset-0 bg-[repeating-linear-gradient(transparent,transparent_31px,#fecdd3_31px,#fecdd3_32px)] opacity-10 pointer-events-none"></div>
              <textarea 
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Write your heart out, my dear Ophelia..."
                className="w-full bg-transparent border-none focus:ring-0 text-slate-700 leading-[32px] text-lg sm:text-xl font-medium resize-none relative z-10 p-2 h-full min-h-[250px]"
              />
            </div>
            <div className="flex justify-between items-center mt-4">
              <div className="flex gap-2 sm:gap-4">
                {['🌸', '💖', '📚', '✨', '☕'].map(m => (
                  <button key={m} className="text-xl sm:text-2xl hover:scale-125 transition-transform active:scale-90">
                    {m}
                  </button>
                ))}
              </div>
              <button 
                onClick={handleSave}
                className="w-14 h-14 sm:w-20 sm:h-20 bg-gradient-to-tr from-rose-500 to-pink-500 text-white rounded-full shadow-2xl shadow-rose-200 hover:scale-110 active:scale-90 transition-all flex items-center justify-center animate-heart"
              >
                <i className="fas fa-heart text-xl sm:text-3xl"></i>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-8 pr-1 sm:pr-4 custom-scrollbar pb-24 md:pb-10">
          {entries.length === 0 ? (
            <div className="h-64 sm:h-96 flex flex-col items-center justify-center text-rose-100 bg-white rounded-[2.5rem] sm:rounded-[4rem] border border-dashed border-rose-200 px-6 text-center">
               <i className="fas fa-book-open text-5xl sm:text-8xl mb-4 sm:mb-6 opacity-40"></i>
               <p className="lovely-font text-xl sm:text-3xl italic">Your secret garden is waiting for its first petal...</p>
            </div>
          ) : (
            entries.map(entry => (
              <div key={entry.id} className="bg-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-lg border border-rose-50 group hover:shadow-2xl transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50/30 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>
                <div className="flex justify-between items-start mb-4 sm:mb-6 relative z-10">
                  <div>
                    <h3 className="lovely-font text-2xl sm:text-3xl text-rose-600 mb-1 leading-tight">{entry.title}</h3>
                    <div className="flex items-center gap-2">
                       <i className="far fa-calendar-days text-[8px] text-rose-300"></i>
                       <p className="text-[8px] sm:text-[10px] font-black text-rose-300 uppercase tracking-widest">{entry.date}</p>
                    </div>
                  </div>
                  <span className="text-2xl sm:text-3xl filter drop-shadow-md">{entry.mood}</span>
                </div>
                <div className="relative">
                  <div className="absolute -left-3 sm:-left-4 top-0 bottom-0 w-1 bg-rose-100 rounded-full opacity-50"></div>
                  <p className="text-slate-600 leading-relaxed italic text-base sm:text-lg pl-3 sm:pl-4">"{entry.content}"</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Mobile Floating Action Button for Journal - ENSURED VISIBILITY */}
      <div className="md:hidden fixed bottom-28 left-1/2 -translate-x-1/2 z-[110]">
        <button 
          onClick={() => setIsWriting(!isWriting)}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-[0_15px_40px_rgba(251,113,133,0.5)] border-4 border-white transition-all duration-500 active:scale-90 animate-heart ${
            isWriting ? 'bg-slate-800 text-white rotate-45 scale-90' : 'bg-gradient-to-tr from-rose-500 to-pink-500 text-white rotate-0 scale-100'
          }`}
        >
          <i className={`fas ${isWriting ? 'fa-xmark' : 'fa-pen-nib'} text-xl`}></i>
          {!isWriting && (
            <span className="absolute -top-12 bg-rose-600 text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg border border-white/20 whitespace-nowrap">Write Reflection</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Journal;
