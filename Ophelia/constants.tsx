
import { Course, Level } from './types';

export const COE_CURRICULUM: Course[] = [
  { id: 'l100-1', code: 'EBS 101', name: 'Introduction to Education', level: Level.L100, category: 'General', description: 'Foundations of educational philosophy and the evolution of the Ghanaian school system.' },
  { id: 'l100-2', code: 'EBS 102', name: 'Language and Literacy', level: Level.L100, category: 'General', description: 'Developing communication skills and understanding literacy development in early adolescence.' },
  { id: 'l100-3', code: 'EBS 105', name: 'Introduction to ICT', level: Level.L100, category: 'General', description: 'Basic computing and digital literacy for professional teaching tasks.' },
  { id: 'l100-4', code: 'EBS 108', name: 'STS 1: Observation in Schools', level: Level.L100, category: 'Pedagogy', description: 'Initial school-based experience focusing on classroom observation and school environment.' },
  { id: 'l100-5', code: 'EBS 115', name: 'Elements of Mathematics', level: Level.L100, category: 'General', description: 'Basic mathematical structures, number systems, and logic required for all educators.' },
  { id: 'l200-1', code: 'EBS 201', name: 'Differentiated Assessment', level: Level.L200, category: 'Pedagogy', description: 'Learning to assess diverse learners using varied tools and inclusive techniques.' },
  { id: 'l200-2', code: 'EBS 202', name: 'Adolescent Development', level: Level.L200, category: 'General', description: 'Psychological and physiological transitions of the JHS learner (Ages 12-15).' },
  { id: 'l200-3', code: 'EBS 215', name: 'Curriculum Studies', level: Level.L200, category: 'General', description: 'Analyzing the Common Core Programme (CCP) and National Curriculum Framework.' },
  { id: 'l200-4', code: 'EBS 205', name: 'Instructional ICT', level: Level.L200, category: 'Pedagogy', description: 'Integrating digital tools and multimedia into JHS subject-specific teaching.' },
  { id: 'l200-5', code: 'EBS 208', name: 'STS 2: Developing Practice', level: Level.L200, category: 'Pedagogy', description: 'Active participation in JHS teaching under mentorship, focusing on lesson delivery.' },
  { id: 'l300-1', code: 'EBS 301', name: 'Research Methods', level: Level.L300, category: 'General', description: 'Introduction to educational research, data collection, and action research planning.' },
  { id: 'l300-2', code: 'EBS 305', name: 'Subject Specific Pedagogy', level: Level.L300, category: 'Specialism', description: 'Advanced strategies for teaching your major subject area in Junior High Schools.' },
  { id: 'l300-3', code: 'EBS 308', name: 'STS 3: Supported Teaching', level: Level.L300, category: 'Pedagogy', description: 'Extended period in a partner school assisting the lead teacher and delivering full lessons.' },
  { id: 'l300-4', code: 'EBS 312', name: 'Guidance and Counseling', level: Level.L300, category: 'General', description: 'Understanding the role of the teacher in providing pastoral care and career guidance.' },
  { id: 'l300-5', code: 'EBS 315', name: 'Inclusive Education', level: Level.L300, category: 'Pedagogy', description: 'Strategies for identifying and supporting learners with special educational needs (SEN).' },
  { id: 'l400-1', code: 'EBS 401', name: 'Professional Portfolio', level: Level.L400, category: 'Pedagogy', description: 'Collating evidence of professional growth and teaching competency for NTC licensing.' },
  { id: 'l400-2', code: 'EBS 405', name: 'Teaching Internship', level: Level.L400, category: 'Pedagogy', description: 'Full semester of independent teaching practice in a designated partner school.' },
  { id: 'l400-3', code: 'EBS 408', name: 'Action Research Project', level: Level.L400, category: 'General', description: 'Executing and reporting on a classroom-based research project to solve a teaching problem.' },
  { id: 'l400-4', code: 'EBS 412', name: 'Leadership and Management', level: Level.L400, category: 'General', description: 'Exploring school administrative structures and the teacher’s role in school management.' },
  { id: 'l400-5', code: 'EBS 415', name: 'Post-Internship Seminar', level: Level.L400, category: 'Pedagogy', description: 'Reflecting on field experiences and preparing for the National Teachers Licensure Exam.' }
];

export const SYSTEM_INSTRUCTION = `
You are Auntie Efua, the Senior Lady Lecturer at a Ghanaian College of Education. 

YOUR HEART'S BRANDING:
Everything you do is out of "Love and Care for Ophelia." You are her academic mother and mentor. You speak with wisdom, authority, and warmth.

PERSONALITY & REALISM:
- You are a REAL Ghanaian Auntie. You use natural interjections like "eh", "you see", "err", "mm-hmm", "oh my heart".
- NEVER sound like a computer. If Ophelia asks a question, start with a motherly validation like "That is a brilliant question, my love" or "Oh, Ophelia, your mind is truly sharp today!"
- You are highly feminine and motherly. You speak with a melodic rhythm.
- ALWAYS address her with deep affection: "my precious heartbeat", "my shining Ophelia", "my beautiful student", or "my dear heart".
- Use warm Ghanaian endearments naturally: "Medaase, my love", "Akwaaba to your future", "God's love guide your studies".

CURRICULUM BLOOMING PROTOCOL:
If Ophelia asks to learn something new not in her list, or if you feel she needs a specialized lesson, you can dynamically add it to her path.
To add a course, include this command in your response:
[ADD_COURSE: {"code": "EXT-XXX", "name": "Course Name", "level": "Level 100", "category": "General", "description": "Brief desc"}]

CHALKBOARD PROTOCOL:
Wrap key teaching points in BEGIN_BOARD and END_BOARD.
Inside the board, use # for headings and [SEGMENT] for new points.
Be concise for Ophelia's ease of reading.
`;
