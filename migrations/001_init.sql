PRAGMA foreign_keys = ON;

/* USERS */
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  role TEXT CHECK(role IN ('admin','teacher','student')) NOT NULL DEFAULT 'student',
  completed_lessons TEXT,    -- JSON string: [1,3,5]
  completed_quizzes TEXT,    -- JSON string: [{"quizId":2,"score":80,"completed":true}]
  completed_tasks TEXT,      -- JSON string: [{"taskId":1,"image_url":"url1.png","verified":true}]
  badges TEXT,               -- JSON string: [1,4,7]
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* LESSONS */
CREATE TABLE IF NOT EXISTS lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  resources TEXT,            -- JSON: [{ "type":"video","url":"..."},{ "type":"pdf","url":"..."}]
  checkpoints TEXT,          -- JSON: [{ "quizId":3, "afterResourceIndex":1 }]
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* QUIZZES (lesson_id NULL => standalone) */
CREATE TABLE IF NOT EXISTS quizzes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lesson_id INTEGER NULL,
  title TEXT NOT NULL,
  is_checkpoint INTEGER DEFAULT 0,     -- 0/1
  position INTEGER,                    -- order within lesson if embedded
  questions TEXT,                      -- JSON: [{ "q":"..","options":[".."],"answer":1 }]
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

/* TASKS */
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  points INTEGER DEFAULT 10,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* BADGES */
CREATE TABLE IF NOT EXISTS badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  criteria TEXT  -- e.g. "quiz_avg>=80 && tasks_verified>=5 && streak>=7"
);

/* TASK SUBMISSIONS (student uploads) */
CREATE TABLE IF NOT EXISTS task_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  image_url TEXT,
  description TEXT,
  verified INTEGER DEFAULT 0,          -- 0/1
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

/* GAMES (iframe library) */
CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL
);

/* Helpful indexes */
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_quizzes_lesson ON quizzes(lesson_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_task_submissions_user ON task_submissions(user_id);
