
import React, { useState } from 'react';
import { getTutorResponse } from '../services/gemini';
import { Course, UploadedNote, Level } from '../types';

interface StudyDeskProps {
  onTopicSelect: (course: Course) => void;
  onSaveNote: (note: UploadedNote) => void;
  onStudyNote: (note: UploadedNote) => void;
}

const StudyDesk: React.FC<StudyDeskProps> = ({ onTopicSelect, onSaveNote, onStudyNote }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [assignedLevel, setAssignedLevel] = useState<Level>(Level.L100);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalysing(true);
    setAnalysis(null);
    setCurrentFile(file);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const mimeType = file.type;

      try {
        const prompt = `My dear Ophelia has uploaded this document: ${file.name}. 
        Auntie Efua, please:
        1. Read it thoroughly as a Senior CoE Lecturer.
        2. Assign it to a Level (100, 200, 300, or 400) based on complexity.
        3. Identify its relevance to the Ghana CoE Curriculum.
        4. Provide a structured summary with "Knowledge Petals" she must master.
        5. Explain its value for her teaching career.
        
        Start your response with [LEVEL: X] where X is 100, 200, 300, or 400. Then provide the analysis.`;
        
        const result = await getTutorResponse(prompt, [], { data: base64, mimeType });
        
        const responseText = result.text || "";
        // Parse level and clean text
        const levelMatch = responseText.match(/\[LEVEL: (\d+)\]/);
        const detectedLevel = levelMatch ? `Level ${levelMatch[1]}` as Level : Level.L100;
        const cleanAnalysis = responseText.replace(/\[LEVEL: \d+\]/, '').trim();
        
        setAssignedLevel(detectedLevel);
        setAnalysis(cleanAnalysis);

        // Auto-persist
        const newNote: UploadedNote = {
          id: `note-${Date.now()}`,
          title: file.name.split('.')[0],
          fileName: file.name,
          analysis: cleanAnalysis,
          level: detectedLevel,
          date: new Date().toLocaleDateString()
        };
        onSaveNote(newNote);

      } catch (err) {
        setAnalysis("Oh lovely, Auntie had a tiny glitch reading that petal. Could you try uploading it again?");
      } finally {
        setIsAnalysing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="bg-white p-10 rounded-[3rem] border-2 border-dashed border-rose-200 flex flex-col items-center text-center relative overflow-hidden group shadow-xl shadow-rose-50/50">
            <div className="absolute inset-0 bg-rose-50/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center text-rose-500 mb-6 group-hover:scale-110 transition-transform shadow-inner">
              <i className="fas fa-file-pdf text-4xl"></i>
            </div>
            <h3 className="lovely-font text-3xl text-rose-600 mb-2">Offer a Study Petal</h3>
            <p className="text-sm text-slate-400 max-w-xs mb-8">Auntie Efua will read your PDF and pin it to your curriculum journey.</p>
            
            <label className="relative cursor-pointer bg-gradient-to-r from-rose-500 to-pink-500 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-200 hover:scale-105 transition-all active:scale-95">
              Choose Your Paper
              <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,image/*" />
            </label>
          </div>

          {isAnalysing && (
            <div className="p-10 bg-white rounded-[3rem] border border-rose-100 flex flex-col items-center gap-6 shadow-sm">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-rose-100 border-t-rose-500 rounded-full animate-spin"></div>
                <i className="fas fa-heart absolute inset-0 flex items-center justify-center text-rose-500 animate-pulse"></i>
              </div>
              <p className="lovely-font text-2xl text-rose-500 text-center">Auntie is carefully reading your paper, Ophelia...</p>
            </div>
          )}

          {analysis && (
            <div className="bg-white p-10 rounded-[3rem] border border-rose-100 shadow-xl animate-in fade-in slide-in-from-top-4 duration-500 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-rose-400"></div>
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
                    <i className="fas fa-feather-pointed"></i>
                  </div>
                  <div>
                    <h4 className="lovely-font text-2xl text-rose-600">Note Analysis</h4>
                    <p className="text-[9px] font-black text-rose-300 uppercase tracking-widest">Added to {assignedLevel}</p>
                  </div>
                </div>
                <button 
                  onClick={() => onStudyNote({ 
                    id: 'temp', title: currentFile?.name || 'My Notes', analysis, fileName: currentFile?.name || '', level: assignedLevel, date: '' 
                  })}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-md shadow-rose-200"
                >
                  <i className="fas fa-chalkboard-user"></i>
                  Start Hall Lecture
                </button>
              </div>
              <div className="prose prose-rose max-w-none text-slate-700 leading-relaxed font-medium italic whitespace-pre-wrap text-sm border-l-4 border-rose-50 pl-6">
                {analysis}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8 flex flex-col justify-center">
          <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-150 transition-transform duration-1000">
               <i className="fas fa-file-invoice text-9xl"></i>
            </div>
            <h4 className="lovely-font text-4xl mb-6">"Everything is connected..."</h4>
            <p className="text-lg text-rose-50 leading-relaxed font-medium mb-8">
              "My dear Ophelia, by bringing your own materials, you are taking ownership of your professional bloom. Auntie will always help you see the link between your papers and the classroom."
            </p>
            <div className="flex items-center gap-4 text-rose-100 text-xs font-black uppercase tracking-widest">
              <i className="fas fa-check-circle"></i>
              <span>Files automatically saved to your curriculum</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyDesk;
