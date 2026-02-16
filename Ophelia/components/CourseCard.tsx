
import React from 'react';
import { Course, Level } from '../types';

interface CourseCardProps {
  course: Course;
  isCompleted: boolean;
  onToggle: (id: string) => void;
  onAskTutor: (course: Course) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, isCompleted, onToggle, onAskTutor }) => {
  const categoryStyles = {
    General: 'bg-rose-50 text-rose-600 border-rose-100',
    Pedagogy: 'bg-pink-50 text-pink-600 border-pink-100',
    Specialism: 'bg-purple-50 text-purple-600 border-purple-100'
  };

  return (
    <div 
      onClick={() => onToggle(course.id)}
      className={`group relative p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border-2 flex flex-col h-full transition-all duration-500 cursor-pointer select-none overflow-hidden ${
        isCompleted 
          ? 'bg-rose-50/50 border-rose-400 shadow-lg shadow-rose-100' 
          : 'bg-white border-rose-50 hover:border-pink-300 hover:shadow-2xl sm:hover:-translate-y-2'
      }`}
    >
      <div className="flex justify-between items-start mb-3 sm:mb-4">
        <span className={`text-[8px] sm:text-[9px] font-black px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full tracking-wider shadow-sm ${
          course.level === Level.L100 ? 'bg-rose-500 text-white' : 'bg-pink-500 text-white'
        }`}>
          {course.code}
        </span>
        <div 
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 transition-all duration-700 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] ${
            isCompleted 
              ? 'bg-rose-500 border-rose-500 text-white scale-125 shadow-md shadow-rose-200' 
              : 'border-rose-100 text-transparent group-hover:border-rose-300'
          }`}
        >
          <i className={`fas fa-heart text-[10px] ${isCompleted ? 'animate-pulse' : ''}`}></i>
        </div>
      </div>
      
      <div className="flex-grow">
        <h3 className="lovely-font text-xl sm:text-2xl text-slate-800 mb-1 leading-tight">{course.name}</h3>
        <p className="text-[10px] sm:text-[11px] text-slate-400 line-clamp-2 sm:line-clamp-3 mb-3 sm:mb-4 leading-relaxed font-medium italic">{course.description}</p>
      </div>

      <div className="mt-auto pt-3 sm:pt-4 border-t border-rose-50 flex items-center justify-between">
        <span className={`text-[7px] sm:text-[8px] font-black uppercase tracking-widest px-2 sm:px-3 py-1 rounded-full border ${categoryStyles[course.category]}`}>
          {course.category}
        </span>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAskTutor(course);
          }}
          className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] font-black text-rose-500 hover:text-rose-700 transition-all bg-rose-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-rose-100 active:scale-90"
        >
          <i className="fas fa-magic"></i>
          Learn
        </button>
      </div>
      
      {/* Sparkle decorative icons */}
      <div className="absolute -bottom-2 -right-2 opacity-10 group-hover:opacity-30 transition-opacity">
        <i className="fas fa-sparkles text-3xl sm:text-4xl text-rose-500"></i>
      </div>

      {/* Completion Overlay Flash */}
      {isCompleted && (
        <div className="absolute inset-0 bg-rose-400/5 pointer-events-none animate-in fade-in duration-500"></div>
      )}
    </div>
  );
};

export default CourseCard;
