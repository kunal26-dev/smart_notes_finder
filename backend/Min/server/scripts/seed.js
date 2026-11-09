// Usage: npm run seed
// Safe to run repeatedly: existing records are skipped, never duplicated or overwritten.
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const Subject = require('../models/Subject');

const DEFAULT_CATEGORIES = [
  { categoryName: 'Notes', description: 'Lecture notes and handwritten notes' },
  { categoryName: 'Assignments', description: 'Assignments and homework' },
  { categoryName: 'Question Banks', description: 'Collections of practice questions' },
  { categoryName: 'Previous Year Papers', description: 'Previous year question papers' },
  { categoryName: 'Presentations', description: 'Slides and presentations' },
  { categoryName: 'Lab Manuals', description: 'Laboratory manuals and records' },
  { categoryName: 'Study Materials', description: 'Reference and general study material' },
  { categoryName: 'Other', description: 'Anything that does not fit another category' },
];

const SAMPLE_SUBJECTS = [
  { subjectName: 'Data Structures', subjectCode: 'CS201', description: 'Arrays, linked lists, trees, graphs and algorithms' },
  { subjectName: 'Database Management Systems', subjectCode: 'CS301', description: 'Relational model, SQL, normalization, transactions' },
  { subjectName: 'Operating Systems', subjectCode: 'CS302', description: 'Processes, memory management, file systems' },
  { subjectName: 'Computer Networks', subjectCode: 'CS303', description: 'Network layers, protocols and security basics' },
  { subjectName: 'Web Development', subjectCode: 'CS304', description: 'HTML, CSS, JavaScript and modern web frameworks' },
  { subjectName: 'Software Engineering', subjectCode: 'CS401', description: 'SDLC, design patterns and testing' },
  { subjectName: 'Engineering Mathematics', subjectCode: 'MA101', description: 'Calculus, linear algebra and probability' },
  { subjectName: 'Engineering Physics', subjectCode: 'PH101', description: 'Mechanics, optics and modern physics' },
];

const seedAdmin = async () => {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.warn('! ADMIN_EMAIL / ADMIN_PASSWORD not set in .env: skipping admin creation');
    return;
  }
  if (ADMIN_PASSWORD.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters');
  }
  const email = ADMIN_EMAIL.trim().toLowerCase();
  if (await User.exists({ email })) {
    console.log(`- Admin/user with email ${email} already exists: skipped`);
    return;
  }
  // The password is hashed by the User model's pre-save hook
  await User.create({
    name: ADMIN_NAME || 'System Admin',
    email,
    password: ADMIN_PASSWORD,
    role: 'Admin',
    accountStatus: 'Active',
  });
  console.log(`+ Admin account created: ${email}`);
};

const seedCategories = async () => {
  for (const cat of DEFAULT_CATEGORIES) {
    const result = await Category.updateOne(
      { categoryName: cat.categoryName },
      { $setOnInsert: cat },
      { upsert: true }
    );
    console.log(`${result.upsertedCount ? '+ Created' : '- Exists '} category: ${cat.categoryName}`);
  }
};

const seedSubjects = async () => {
  for (const sub of SAMPLE_SUBJECTS) {
    const exists = await Subject.exists({
      $or: [{ subjectCode: sub.subjectCode }, { subjectName: sub.subjectName }],
    });
    if (exists) {
      console.log(`- Exists  subject: ${sub.subjectCode}`);
    } else {
      await Subject.create(sub);
      console.log(`+ Created subject: ${sub.subjectCode} ${sub.subjectName}`);
    }
  }
};

(async () => {
  try {
    await connectDB();
    await seedAdmin();
    await seedCategories();
    await seedSubjects();
    console.log('Seeding finished.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(`Seeding failed: ${err.message}`);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
})();
