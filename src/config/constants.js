// App Information
export const APP_NAME = 'Instructor Mitra';
export const APP_VERSION = '1.0.0';

// Admin Email
export const ADMIN_EMAIL = 'firstrank1993@gmail.com';

// User Status
export const USER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  BLOCKED: 'blocked',
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  INSTRUCTOR: 'instructor',
};

// Trade Durations
export const TRADE_DURATIONS = {
  ONE_YEAR: 1,
  TWO_YEAR: 2,
};

// Halves
export const HALVES = {
  ONE_YEAR: ['H1', 'H2'],
  TWO_YEAR: ['H1', 'H2', 'H3', 'H4'],
};

// Subjects
export const SUBJECTS = {
  TP: 'Trade Practical',
  TT: 'Trade Theory',
  ES: 'Employability Skills',
  ED: 'Engineering Drawing',
  WCS: 'Workshop Calculation & Science',
};

// Marks Configuration
export const MARKS_CONFIG = {
  TP_MAX: 70,
  ES_MAX_3SUB: 30,
  ES_MAX_5SUB: 10,
  ED_MAX: 10,
  WCS_MAX: 10,
  TOTAL_MAX: 100,
  PRACTICAL_MAX: 100,
  PRACTICAL_MIN_PASS: 60,
};

// Distribution Ranges
export const DISTRIBUTION_RANGE = {
  LO_MIN: 61,
  LO_MAX: 95,
  PRACTICAL_MIN: 61,
  PRACTICAL_MAX: 95,
};

// Batch Status
export const BATCH_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
};

// Marks Entry Type
export const ENTRY_TYPE = {
  CASE1: 'case1',
  CASE2: 'case2',
};

// Assessment Criteria (Default)
export const DEFAULT_CRITERIA = [
  {
    id: 'c1',
    name: 'Safety Consciousness',
    maxMarks: 15,
    order: 1,
    subCriteria: [
      { subId: 'c1s1', name: 'Dress code', maxMarks: 2, order: 1 },
      { subId: 'c1s2', name: 'Use PPE', maxMarks: 5, order: 2 },
      { subId: 'c1s3', name: 'Apply/practice safety', maxMarks: 8, order: 3 },
    ],
  },
  {
    id: 'c2',
    name: 'Workplace Hygiene/Economical use of Materials',
    maxMarks: 10,
    order: 2,
    subCriteria: [
      { subId: 'c2s1', name: 'Maintain cleanliness', maxMarks: 3, order: 1 },
      { subId: 'c2s2', name: 'Dispose scrap', maxMarks: 2, order: 2 },
      { subId: 'c2s3', name: 'Select appropriate material', maxMarks: 5, order: 3 },
    ],
  },
  {
    id: 'c3',
    name: 'Attendance/Punctuality',
    maxMarks: 10,
    order: 3,
    subCriteria: [
      { subId: 'c3s1', name: 'Initiative', maxMarks: 3, order: 1 },
      { subId: 'c3s2', name: 'Accountability', maxMarks: 3, order: 2 },
      { subId: 'c3s3', name: 'Participative', maxMarks: 4, order: 3 },
    ],
  },
  {
    id: 'c4',
    name: 'Ability to follow Manuals/Written instructions',
    maxMarks: 5,
    order: 4,
    subCriteria: [
      { subId: 'c4s1', name: 'Select right manual', maxMarks: 1, order: 1 },
      { subId: 'c4s2', name: 'Search topic', maxMarks: 2, order: 2 },
      { subId: 'c4s3', name: 'Read & interpret', maxMarks: 2, order: 3 },
    ],
  },
  {
    id: 'c5',
    name: 'Application of Knowledge',
    maxMarks: 10,
    order: 5,
    subCriteria: [
      { subId: 'c5s1', name: 'Plan the work', maxMarks: 4, order: 1 },
      { subId: 'c5s2', name: 'Select tools', maxMarks: 3, order: 2 },
      { subId: 'c5s3', name: 'Review work', maxMarks: 3, order: 3 },
    ],
  },
  {
    id: 'c6',
    name: 'Skills to Handle Tools & Equipment',
    maxMarks: 10,
    order: 6,
    subCriteria: [
      { subId: 'c6s1', name: 'Handle tools', maxMarks: 4, order: 1 },
      { subId: 'c6s2', name: 'Maintain safety', maxMarks: 3, order: 2 },
      { subId: 'c6s3', name: 'Care & maintain', maxMarks: 3, order: 3 },
    ],
  },
  {
    id: 'c7',
    name: 'Speed in doing work',
    maxMarks: 10,
    order: 7,
    subCriteria: [
      { subId: 'c7s1', name: 'Properly sequence', maxMarks: 3, order: 1 },
      { subId: 'c7s2', name: 'Use technique', maxMarks: 5, order: 2 },
      { subId: 'c7s3', name: 'Review during execution', maxMarks: 2, order: 3 },
    ],
  },
  {
    id: 'c8',
    name: 'Quality in Workmanship',
    maxMarks: 15,
    order: 8,
    subCriteria: [
      { subId: 'c8s1', name: 'Achieve accuracy', maxMarks: 7, order: 1 },
      { subId: 'c8s2', name: 'Conform to requirement', maxMarks: 3, order: 2 },
      { subId: 'c8s3', name: 'Satisfy purpose', maxMarks: 5, order: 3 },
    ],
  },
  {
    id: 'c9',
    name: 'Viva',
    maxMarks: 15,
    order: 9,
    subCriteria: [
      { subId: 'c9s1', name: 'Response with clarity', maxMarks: 7, order: 1 },
      { subId: 'c9s2', name: 'Technical understanding', maxMarks: 5, order: 2 },
      { subId: 'c9s3', name: 'Conscious toward job role', maxMarks: 3, order: 3 },
    ],
  },
];

// Batch Size for Firestore writes
export const BATCH_WRITE_SIZE = 25;
export const BATCH_WRITE_DELAY = 150;

// Report Types
export const REPORT_TYPES = {
  FAR1: 'FAR-1',
  FAR2_ED: 'FAR-2-ED',
  FAR2_WCS: 'FAR-2-WCS',
  FAR3_ES: 'FAR-3-ES',
};