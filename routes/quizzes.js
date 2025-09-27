const router = require("express").Router();
const auth = require("../middleware/authGuard");
const role = require("../middleware/roleGuard");
const db = require("../config/db");
const points = require("../services/pointsService");

router.get("/", auth, (req, res) => {
  const quizzes = db.prepare("SELECT * FROM quizzes ORDER BY lesson_id IS NULL DESC, lesson_id ASC, position ASC").all();
  res.render("quizzes/list", { quizzes });
});

router.get("/:id/take", auth, (req, res) => {
  const q = db.prepare("SELECT * FROM quizzes WHERE id=?").get(req.params.id);
  res.render("quizzes/take", { quiz: q, questions: JSON.parse(q.questions || "[]") });
});

router.get("/aigenerator", auth, (req, res) => {
  res.render("quizzes/editorAI");
});

router.post("/generate", auth, async (req, res) => {
  res.send({
    questions: [
      {
        question: "What is the main purpose of photosynthesis?",
        options: [
          "To convert sunlight into chemical energy",
          "To produce oxygen for animals",
          "To absorb carbon dioxide from the atmosphere",
          "To create water for plants",
        ],
        answer: 0,
      },
      {
        question: "Which pigment is primarily responsible for capturing light energy in plants?",
        options: ["Chlorophyll", "Carotenoids", "Xanthophylls", "Anthocyanins"],
        answer: 0,
      },
      {
        question: "What are the two main stages of photosynthesis?",
        options: [
          "Light-dependent reactions and Calvin cycle",
          "Glycolysis and Krebs cycle",
          "Electron transport chain and fermentation",
          "Light-independent reactions and photolysis",
        ],
        answer: 0,
      },
    ],
  });
});

router.post("/:id/submit", auth, (req, res) => {
  const quiz = db.prepare("SELECT * FROM quizzes WHERE id=?").get(req.params.id);
  const qs = JSON.parse(quiz.questions || "[]");
  let correct = 0;
  qs.forEach((q, i) => {
    if (Number(req.body[`q_${i}`]) === Number(q.answer)) correct++;
  });
  const score = Math.round((correct / qs.length) * 100);

  // update user progress
  const u = db.prepare("SELECT * FROM users WHERE id=?").get(req.user.id);
  const hist = JSON.parse(u.completed_quizzes || "[]");
  const idx = hist.findIndex((h) => h.quizId === quiz.id);
  const rec = { quizId: quiz.id, score, completed: true };
  if (idx >= 0) hist[idx] = rec;
  else hist.push(rec);
  db.prepare("UPDATE users SET completed_quizzes=? WHERE id=?").run(JSON.stringify(hist), req.user.id);

  // award points per correct answer
  for (let i = 0; i < correct; i++) points.awardQuizCorrect(req.user.id);

  req.flash("success", `Score: ${score}%`);
  res.redirect("/quizzes");
});

// CRUD
router.get("/create/new", role("teacher", "admin"), (req, res) => res.render("quizzes/editor", { quiz: null }));
router.post("/create", role("teacher", "admin"), (req, res) => {
  const { lesson_id, title, is_checkpoint, position, questions } = req.body;
  db.prepare("INSERT INTO quizzes(lesson_id,title,is_checkpoint,position,questions) VALUES(?,?,?,?,?)").run(
    lesson_id || null,
    title,
    is_checkpoint ? 1 : 0,
    position || null,
    questions
  );
  res.redirect("/quizzes");
});

module.exports = router;
