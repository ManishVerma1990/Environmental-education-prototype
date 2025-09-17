/**
 * Seed EcoLearn DB without SQLite CLI.
 * - Ensures schema is applied (reads migrations/001_init.sql)
 * - Inserts demo Lessons, Quizzes, Tasks, Badges, Games
 * - (Optional) creates Admin/Teacher/Student users with bcrypt hashes
 *
 * Usage: node scripts/seed.js
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

// Use the same DB instance as the app
const db = require('../config/db'); // better-sqlite3 instance

// --- 1) Ensure schema is applied ---
function ensureSchema() {
  const initPath = path.join(__dirname, '..', 'migrations', '001_init.sql');
  const sql = fs.readFileSync(initPath, 'utf8');
  db.exec(sql);
  const ok = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    .get();
  if (!ok) throw new Error('Schema not applied (users table missing).');
  console.log('✔ Schema OK');
}

// --- 2) Optional: create base users if they don't exist ---
function upsertUser(name, email, password, role, score = 0) {
  const exists = db.prepare('SELECT id FROM users WHERE email=?').get(email);
  if (exists) {
    console.log(`• User exists: ${email}`);
    return exists.id;
  }
  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare(
      `INSERT INTO users (name,email,password_hash,role,score,completed_lessons,completed_quizzes,completed_tasks,badges)
       VALUES (?,?,?,?,?, '[]','[]','[]','[]')`
    )
    .run(name, email, hash, role, score);
  console.log(`+ User created: ${email} (${role})`);
  return info.lastInsertRowid;
}

// --- 3) Seed content ---
function seedContent() {
  // Clear previous demo data (keep users)
  db.prepare('DELETE FROM task_submissions').run();
  db.prepare('DELETE FROM quizzes').run();
  db.prepare('DELETE FROM lessons').run();
  db.prepare('DELETE FROM tasks').run();
  db.prepare('DELETE FROM badges').run();
  db.prepare('DELETE FROM games').run();

  // LESSON 1: Recycling Basics
  const lesson1Resources = [
    { type: 'video', url: 'https://www.youtube.com/embed/6jQ7y_qQYUA' },
    {
      type: 'pdf',
      url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
    },
    {
      type: 'imageSet',
      images: [
        'https://images.unsplash.com/photo-1528323273322-d81458248d40?w=900',
        'https://images.unsplash.com/photo-1523861751938-12193bffd2f9?w=900',
      ],
    },
  ];

  const lesson1 = db
    .prepare(
      `INSERT INTO lessons (title,description,resources,checkpoints)
       VALUES (?,?,?, '[]')`
    )
    .run(
      'Recycling Basics',
      'Learn the 3Rs: Reduce, Reuse, Recycle — and how to sort waste properly.',
      JSON.stringify(lesson1Resources)
    );
  const lesson1Id = lesson1.lastInsertRowid;

  // LESSON 2: Water Conservation
  const lesson2Resources = [
    { type: 'video', url: 'https://www.youtube.com/embed/9iMGFqMmUFs' },
    {
      type: 'pdf',
      url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
    },
  ];
  const lesson2 = db
    .prepare(
      `INSERT INTO lessons (title,description,resources,checkpoints)
       VALUES (?,?,?, '[]')`
    )
    .run(
      'Water Conservation',
      'Habits that save water at home and school.',
      JSON.stringify(lesson2Resources)
    );
  const lesson2Id = lesson2.lastInsertRowid;

  // QUIZ 1: Embedded checkpoint for lesson 1 (we update the lesson checkpoints after we know quiz id)
  const quiz1 = db
    .prepare(
      `INSERT INTO quizzes (lesson_id,title,is_checkpoint,position,questions)
       VALUES (?,?,?,?,?)`
    )
    .run(
      lesson1Id,
      'Checkpoint: Recycling Basics',
      1, // is_checkpoint
      1, // position in lesson
      JSON.stringify([
        {
          q: 'Which bin is typically used for paper?',
          options: ['Blue', 'Green', 'Red'],
          answer: 0,
        },
        {
          q: 'Metal cans should be...',
          options: ['Thrown in mixed waste', 'Rinsed and recycled', 'Buried'],
          answer: 1,
        },
      ])
    );
  const quiz1Id = quiz1.lastInsertRowid;

  // Update lesson 1 checkpoints to reference quiz1
  const lesson1Checkpoints = [{ quizId: quiz1Id, afterResourceIndex: 0 }];
  db.prepare('UPDATE lessons SET checkpoints=? WHERE id=?').run(
    JSON.stringify(lesson1Checkpoints),
    lesson1Id
  );

  // QUIZ 2: Standalone quiz
  db.prepare(
    `INSERT INTO quizzes (lesson_id,title,is_checkpoint,position,questions)
     VALUES (?,?,?,?,?)`
  ).run(
    null,
    'Eco Awareness — Quick Check',
    0,
    null,
    JSON.stringify([
      {
        q: 'Best time to water plants?',
        options: ['Noon', 'Early morning/evening', 'Anytime'],
        answer: 1,
      },
      {
        q: 'Turning off lights saves...',
        options: ['Energy', 'Nothing', 'Water'],
        answer: 0,
      },
    ])
  );

  // TASKS
  db.prepare(
    `INSERT INTO tasks (title,description,points) VALUES (?,?,?)`
  ).run(
    'Segregate Household Waste',
    'Set up separate bins for wet, dry, and hazardous waste at home. Submit a photo.',
    15
  );
  db.prepare(
    `INSERT INTO tasks (title,description,points) VALUES (?,?,?)`
  ).run(
    'Plant a Sapling',
    'Plant a tree/sapling and water it for a week. Submit before/after photos.',
    25
  );
  db.prepare(
    `INSERT INTO tasks (title,description,points) VALUES (?,?,?)`
  ).run(
    'Clean a Public Area',
    'Collect litter from a safe, small public spot and dispose of it properly.',
    30
  );

  // BADGES
  db.prepare(
    `INSERT INTO badges (name,description,icon_url,criteria) VALUES (?,?,?,?)`
  ).run(
    'Quiz Whiz',
    'Achieve an average quiz score of 80% or higher.',
    'https://images.unsplash.com/photo-1557800636-894a64c1696f?w=256',
    'quiz_avg>=80'
  );
  db.prepare(
    `INSERT INTO badges (name,description,icon_url,criteria) VALUES (?,?,?,?)`
  ).run(
    'Eco Activist',
    'Verify completion of 3 or more real-world tasks.',
    'https://images.unsplash.com/photo-1526404428533-3811a5342c6f?w=256',
    'tasks_verified>=3'
  );
  db.prepare(
    `INSERT INTO badges (name,description,icon_url,criteria) VALUES (?,?,?,?)`
  ).run(
    'Consistency Star',
    'Keep a 7-day activity/login streak.',
    'https://images.unsplash.com/photo-1493810329807-99a94418b6bf?w=256',
    'streak>=7'
  );

  // GAMES (iframe-friendly)
  db.prepare(
    `INSERT INTO games (title,description,url) VALUES (?,?,?)`
  ).run(
    'Recycling Sorter (Demo)',
    'Drag-and-drop recyclable items into the correct bins (CodePen embed demo).',
    'https://codepen.io/team/codepen/embed/PNaGbb?default-tab=result'
  );

  console.log('✔ Content seeded');
}

function main() {
  ensureSchema();

  // Wrap seeding in a transaction
  const txn = db.transaction(() => {
    // OPTIONAL: demo users
    const adminId = upsertUser('Admin', 'admin@eco.local', 'admin123', 'admin', 100);
    const teacherId = upsertUser('Teacher Tina', 'teacher@eco.local', 'teacher123', 'teacher', 50);
    const studentId = upsertUser('Student Sam', 'student@eco.local', 'student123', 'student', 0);

    seedContent();
  });

  txn();
  console.log('✅ Seeding complete.');
}

main();
