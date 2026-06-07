import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Your Firebase config - same as firebase.js
const firebaseConfig = {
  apiKey: "AIzaSyBIaYbJgBEXv3SFhl4QuXRWJJrugNsFMb4",
  authDomain: "instructor-mitra.firebaseapp.com",
  projectId: "instructor-mitra",
  storageBucket: "instructor-mitra.firebasestorage.app",
  messagingSenderId: "373819129699",
  appId: "1:373819129699:web:d47e73b47e25354f309d56"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ================================================
// DEFAULT ASSESSMENT CRITERIA DATA
// ================================================
const defaultCriteria = [
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

// ================================================
// SYSTEM CONFIG DATA
// ================================================
const systemConfig = {
  appName: 'Instructor Mitra',
  version: '1.0.0',
  maintenanceMode: false,
  allowNewRegistrations: true,
  updatedAt: serverTimestamp(),
};

// ================================================
// SEED FUNCTIONS
// ================================================

async function seedCriteria() {
  console.log('Seeding assessment criteria...');
  for (const criteria of defaultCriteria) {
    await setDoc(doc(db, 'assessmentCriteria', criteria.id), {
      ...criteria,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`✅ Added criteria: ${criteria.name}`);
  }
  console.log('✅ All criteria seeded successfully!');
}

async function seedSystemConfig() {
  console.log('Seeding system config...');
  await setDoc(doc(db, 'systemConfig', 'general'), systemConfig);
  console.log('✅ System config seeded!');
}

async function seedSampleTrades() {
  console.log('Seeding sample trades...');
  
  const trades = [
    {
      name: 'Electrician',
      duration: 2,
      subjects: ['TP', 'TT', 'ES', 'ED', 'WCS'],
      isActive: true,
    },
    {
      name: 'Fitter',
      duration: 2,
      subjects: ['TP', 'TT', 'ES', 'ED', 'WCS'],
      isActive: true,
    },
    {
      name: 'Welder',
      duration: 1,
      subjects: ['TP', 'TT', 'ES'],
      isActive: true,
    },
    {
      name: 'Carpenter',
      duration: 1,
      subjects: ['TP', 'TT', 'ES'],
      isActive: true,
    },
    {
      name: 'Plumber',
      duration: 1,
      subjects: ['TP', 'TT', 'ES'],
      isActive: true,
    },
  ];

  for (const trade of trades) {
    const ref = await addDoc(collection(db, 'trades'), {
      ...trade,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`✅ Added trade: ${trade.name} (ID: ${ref.id})`);
  }
  console.log('✅ Sample trades seeded!');
}

// ================================================
// RUN ALL SEEDS
// ================================================
async function runSeed() {
  console.log('🚀 Starting database seed...');
  console.log('================================');
  
  try {
    await seedSystemConfig();
    await seedCriteria();
    await seedSampleTrades();
    
    console.log('================================');
    console.log('🎉 Database seeded successfully!');
    console.log('You can now start building the app.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

runSeed();