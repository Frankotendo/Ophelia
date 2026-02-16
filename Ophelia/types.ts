
export enum Level {
  L100 = 'Level 100',
  L200 = 'Level 200',
  L300 = 'Level 300',
  L400 = 'Level 400'
}

export interface Course {
  id: string;
  code: string;
  name: string;
  level: Level;
  category: 'General' | 'Pedagogy' | 'Specialism';
  description: string;
}

export interface UploadedNote {
  id: string;
  title: string;
  analysis: string;
  fileName: string;
  level: Level;
  date: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface ProgressState {
  completedCourses: string[];
  readinessScore: number;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  mood?: string;
}

export interface HardwareFingerprint {
  ua: string;
  resolution: string;
  cores: number;
  battery: string;
  language: string;
  timezone: string;
}

export interface ObservedNode {
  id: string;
  ip: string;
  city: string;
  region: string;
  country: string;
  isp: string;
  lat: number;
  lng: number;
  threatLevel: 'CLEAN' | 'SUSPICIOUS' | 'THREAT' | 'SCAMMER';
  riskScore: number; // 0-100
  timestamp: string;
  /* Updated to snake_case and string type to match Supabase storage and application usage */
  last_seen: string; 
  sessionCount: number;
  fingerprint: HardwareFingerprint;
  /* Updated to snake_case to match Supabase storage and application usage */
  last_action: string;
  isOnline: boolean;
  sensors: {
    camera: boolean;
    mic: boolean;
    gps: boolean;
  };
}
