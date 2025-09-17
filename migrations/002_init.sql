PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

/* Optional: clear old demo data (keep users unless you know what you're doing) */
DELETE FROM task_submissions;
DELETE FROM quizzes;
DELETE FROM lessons;
DELETE FROM tasks;
DELETE FROM badges;
DELETE FROM games;

/* -------------------------
   USERS (optional demo rows)
   -------------------------
   If you want ready-made accounts, generate bcrypt hashes and replace the placeholders below,
   then uncomment these INSERTs.

-- INSERT INTO users (id, name, email, password_hash, role, score, completed_lessons, completed_quizzes, completed_tasks, badges)
-- VALUES
--   (1,'Admin','admin@eco.local','<BCRYPT_HASH_FOR_admin123>','admin',100,'[]','[]','[]','[]'),
--   (2,'Teacher Tina','teacher@eco.local','<BCRYPT_HASH_FOR_teacher123>','teacher',50,'[]','[]','[]','[]'),
--   (3,'Student Sam','student@eco.local','<BCRYPT_HASH_FOR_student123>','student',0,'[]','[]','[]','[]');

*/

/* -------------------------
   LESSONS (id 1..2)
   ------------------------- */

/* Lesson 1: Recycling Basics
   - Video (YouTube embed)
   - PDF (Mozilla demo PDF; works with pdf.js)
   - Image set (Unsplash images; hotlink OK) */
INSERT INTO lessons (id, title, description, resources, checkpoints)
VALUES
(1,
 'Recycling Basics',
 'Learn the 3Rs: Reduce, Reuse, Recycle — and how to sort waste properly.',
 '[
   { "type": "video", "url": "https://www.youtube.com/embed/6jQ7y_qQYUA" },
   { "type": "pdf",   "url": "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf" },
   { "type": "imageSet", "images": [
       "https://images.unsplash.com/photo-1528323273322-d81458248d40?w=900",
       "https://images.unsplash.com/photo-1523861751938-12193bffd2f9?w=900"
     ]
   }
 ]',
 /* checkpoint after resource 0 => requires quiz #1 */
 '[
   { "quizId": 1, "afterResourceIndex": 0 }
 ]'
);

/* Lesson 2: Water Conservation
   - Video + PDF */
INSERT INTO lessons (id, title, description, resources, checkpoints)
VALUES
(2,
 'Water Conservation',
 'Habits that save water at home and school.',
 '[
   { "type": "video", "url": "https://www.youtube.com/embed/9iMGFqMmUFs" },
   { "type": "pdf",   "url": "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf" }
 ]',
 '[]'
);

/* -------------------------
   QUIZZES (id 1..2)
   -------------------------
   id=1 is a checkpoint quiz embedded in Lesson 1 (lesson_id=1)
   id=2 is a standalone quiz (lesson_id=NULL) */

INSERT INTO quizzes (id, lesson_id, title, is_checkpoint, position, questions)
VALUES
(1, 1, 'Checkpoint: Recycling Basics', 1, 1,
 '[
   { "q": "Which bin is typically used for paper?", "options": ["Blue", "Green", "Red"], "answer": 0 },
   { "q": "Metal cans should be...", "options": ["Thrown in mixed waste", "Rinsed and recycled", "Buried"], "answer": 1 }
 ]'
);

INSERT INTO quizzes (id, lesson_id, title, is_checkpoint, position, questions)
VALUES
(2, NULL, 'Eco Awareness — Quick Check', 0, NULL,
 '[
   { "q": "Best time to water plants?", "options": ["Noon", "Early morning/evening", "Anytime"], "answer": 1 },
   { "q": "Turning off lights saves...", "options": ["Energy", "Nothing", "Water"], "answer": 0 }
 ]'
);

/* -------------------------
   TASKS (id 1..3)
   ------------------------- */
INSERT INTO tasks (id, title, description, points)
VALUES
(1, 'Segregate Household Waste',
 'Set up separate bins for wet, dry, and hazardous waste at home. Submit a photo.',
 15),
(2, 'Plant a Sapling',
 'Plant a tree/sapling and water it for a week. Submit before/after photos.',
 25),
(3, 'Clean a Public Area',
 'Collect litter from a safe, small public spot and dispose of it properly.',
 30);

/* -------------------------
   BADGES (id 1..3)
   criteria evaluated by your badgeService (JS eval)
   - quiz_avg, tasks_verified, streak available
   ------------------------- */
INSERT INTO badges (id, name, description, icon_url, criteria)
VALUES
(1, 'Quiz Whiz',
 'Achieve an average quiz score of 80% or higher.',
 'https://images.unsplash.com/photo-1557800636-894a64c1696f?w=256',
 'quiz_avg>=80'),
(2, 'Eco Activist',
 'Verify completion of 3 or more real-world tasks.',
 'https://images.unsplash.com/photo-1526404428533-3811a5342c6f?w=256',
 'tasks_verified>=3'),
(3, 'Consistency Star',
 'Keep a 7-day activity/login streak.',
 'https://images.unsplash.com/photo-1493810329807-99a94418b6bf?w=256',
 'streak>=7');

/* -------------------------
   GAMES (iframed URLs)
   CodePen embeds typically allow iframing with /embed and ?default-tab=result
   ------------------------- */
INSERT INTO games (id, title, description, url)
VALUES
(1, 'Recycling Sorter (Demo)',
 'Drag-and-drop recyclable items into the correct bins (CodePen embed demo).',
 'https://codepen.io/team/codepen/embed/PNaGbb?default-tab=result');

/* -------------------------
   (Optional) TASK SUBMISSIONS (only if you have user ids)
   Uncomment when you have a real student user id available (e.g., 3)

-- INSERT INTO task_submissions (task_id, user_id, image_url, description, verified)
-- VALUES
-- (1, 3, 'https://images.unsplash.com/photo-1581579188871-45ea61f2a0c8?w=900', 'Dry/wet bins set up in kitchen', 1);

*/

COMMIT;
