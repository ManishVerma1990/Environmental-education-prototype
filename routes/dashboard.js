const router = require("express").Router();
const auth = require("../middleware/authGuard");
const db = require("../config/db");

router.get("/", auth, (req, res) => {
  const top = db.prepare("SELECT name, score FROM users ORDER BY score DESC LIMIT 10").all();
  const user = db.prepare("SELECT * FROM users WHERE id=?").get(req.user.id);
  const completed_lessons = JSON.parse(user.completed_lessons || "[]");
  const completed_quizzes = JSON.parse(user.completed_quizzes || "[]");
  const tasks = db.prepare("SELECT * FROM task_submissions WHERE user_id=?").all(req.user.id);
  const rows = db
    .prepare(
      "SELECT id, name, email, score, role, completed_lessons, completed_quizzes, completed_tasks FROM users WHERE role = 'student'"
    )
    .all();

  const students = rows.map((s) => {
    const lessons = s.completed_lessons ? JSON.parse(s.completed_lessons) : [];
    const quizzes = s.completed_quizzes ? JSON.parse(s.completed_quizzes) : [];
    const tasks = s.completed_tasks ? JSON.parse(s.completed_tasks) : [];

    // Simple overall progress (weight = count of items)
    const total = lessons.length + quizzes.length + tasks.length;

    return {
      id: s.id,
      name: s.name,
      score: s.score,
      lessons: lessons.length,
      quizzes: quizzes.length,
      tasks: tasks.length,
      progress: total, // you can normalize this later if needed
    };
  });

  const view = req.user.role === "admin" ? "admin" : req.user.role === "teacher" ? "teacher" : "student";
  res.render(`dashboards/${view}`, { leaderboard: top, completed_lessons, completed_quizzes, tasks, students });
});

module.exports = router;
