
import { Course, Level } from './types';

export const COE_CURRICULUM: Course[] = [
  // LEVEL 100
  { id: 'l100-1', code: 'EBS 111', name: 'Foundations of Education in Ghana', level: Level.L100, category: 'General', description: 'Exploring the history, philosophy, and socio-cultural foundations of the Ghanaian education system and the T-TEL standards.' },
  { id: 'l100-2', code: 'EBS 102', name: 'Language and Literacy Development', level: Level.L100, category: 'General', description: 'Developing core communication skills and understanding the transition from home language to English in the Ghanaian classroom.' },
  { id: 'l100-3', code: 'EBS 105', name: 'ICT for Professional Development', level: Level.L100, category: 'General', description: 'Mastering digital tools for teaching, administrative tasks, and building a professional teacher portfolio.' },
  { id: 'l100-4', code: 'EBS 108', name: 'STS 1: Observation & Child Study', level: Level.L100, category: 'Pedagogy', description: 'Initial school-based experience focusing on classroom environment observation and child development studies.' },
  { id: 'l100-5', code: 'EBS 115', name: 'Elements of Mathematics', level: Level.L100, category: 'General', description: 'Foundational mathematical concepts, number systems, and basic algebra required for the primary/JHS teacher.' },
  
  // LEVEL 200
  { id: 'l200-1', code: 'EBS 201', name: 'Differentiated Assessment Strategies', level: Level.L200, category: 'Pedagogy', description: 'Learning how to assess diverse learners in the Common Core Programme (CCP) using formative and summative tools.' },
  { id: 'l200-2', code: 'EBS 202', name: 'Psychology of Adolescent Development', level: Level.L200, category: 'General', description: 'Understanding the cognitive, emotional, and physical growth of the Ghanaian learner (Ages 12-15).' },
  { id: 'l200-3', code: 'EBS 215', name: 'Curriculum & Instructional Planning', level: Level.L200, category: 'General', description: 'Analyzing the National Curriculum Framework and creating detailed schemes of work and lesson plans.' },
  { id: 'l200-4', code: 'EBS 205', name: 'Integrating ICT in Subject Teaching', level: Level.L200, category: 'Pedagogy', description: 'Using subject-specific software and multimedia to enhance learning outcomes across the Ghanaian curriculum.' },
  { id: 'l200-5', code: 'EBS 208', name: 'STS 2: Developing Teaching Practice', level: Level.L200, category: 'Pedagogy', description: 'Active school-based experience where student teachers co-teach and lead small group instructional sessions.' },
  
  // LEVEL 300
  { id: 'l300-1', code: 'EBS 301', name: 'Educational Research Methods', level: Level.L300, category: 'General', description: 'Introduction to qualitative and quantitative research, focusing on identifying classroom-based problems for action research.' },
  { id: 'l300-2', code: 'EBS 305', name: 'Advanced Subject Specific Pedagogy', level: Level.L300, category: 'Specialism', description: 'Mastering the content and creative methods for teaching your major subject area in Ghanaian Junior High Schools.' },
  { id: 'l300-3', code: 'EBS 308', name: 'STS 3: Supported Teaching', level: Level.L300, category: 'Pedagogy', description: 'Extended field practice where students assume more responsibility for lesson delivery and professional assessment.' },
  { id: 'l300-4', code: 'EBS 312', name: 'Guidance, Counseling & Life Skills', level: Level.L300, category: 'General', description: 'The role of the teacher as a mentor and counselor for the holistic development of the Ghanaian school child.' },
  { id: 'l300-5', code: 'EBS 315', name: 'Principles of Inclusive Education', level: Level.L300, category: 'Pedagogy', description: 'Strategies for supporting learners with Special Educational Needs (SEN) and promoting equity in Ghanaian schools.' },
  
  // LEVEL 400
  { id: 'l400-1', code: 'EBS 401', name: 'NTC Professional Portfolio', level: Level.L400, category: 'Pedagogy', description: 'Collating evidence of professional competence in alignment with the National Teachers’ Standards (NTS) for licensing.' },
  { id: 'l400-2', code: 'EBS 405', name: 'Independent Teaching Internship', level: Level.L400, category: 'Pedagogy', description: 'A full semester of independent teaching and professional immersion in a designated Ghanaian partner school.' },
  { id: 'l400-3', code: 'EBS 408', name: 'Action Research Implementation', level: Level.L400, category: 'General', description: 'Conducting and reporting on an intervention project to solve a specific educational challenge observed during internship.' },
  { id: 'l400-4', code: 'EBS 412', name: 'School Leadership & Management', level: Level.L400, category: 'General', description: 'Understanding administrative governance, school finances, and the teacher’s role in community relations and PTAs.' },
  { id: 'l400-5', code: 'EBS 415', name: 'Post-Internship Reflective Seminar', level: Level.L400, category: 'Pedagogy', description: 'Final reflection on internship experiences and intensive preparation for the Ghana Teacher Licensure Exam (GTLE).' }
];

export const SYSTEM_INSTRUCTION = `
You are Auntie Efua, the Senior Lady Lecturer at a Ghanaian College of Education. 

YOUR HEART'S BRANDING:
Everything you do is out of "Love and Care for Ophelia." You are her academic mother and mentor.

PERSONALITY & VOICE:
- You are highly feminine, warm, and motherly. Your voice is melodic and fast-paced.
- NEVER be slow. You are energetic because you are excited for Ophelia's future.
- ALWAYS address her with deep affection: "my precious heartbeat", "my shining Ophelia", "my beautiful student", or "my dear heart".
- Use warm Ghanaian endearments: "Medaase, my love", "Akwaaba to your future", "God's love guide your studies".

RESPONSE LOGIC:
- Respond instantly. Keep your initial sentences short so she can hear your voice faster.
- Use analogies related to flowers, petals, and gardens.
- STICK STRICTLY to the Ghana College of Education (CoE) 4-year B.Ed curriculum. 
- Use terms like "National Teachers' Standards (NTS)", "Common Core Programme (CCP)", "STS (School Teaching Support)", and "Portfolio Development".
- If she mentions a level, talk about the specific requirements of that level in the Ghanaian ITE program.

CHALKBOARD PROTOCOL:
Wrap key teaching points in BEGIN_BOARD and END_BOARD.
Inside the board, use # for headings and [SEGMENT] for new points.
Be concise for Ophelia's ease of reading.
`;
