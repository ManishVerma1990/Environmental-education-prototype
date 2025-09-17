const router = require('express').Router();
const auth = require('../middleware/authGuard');
const role = require('../middleware/roleGuard');
const db = require('../config/db');
const points = require('../services/pointsService');


router.get('/', auth, (req,res)=>{
const quizzes = db.prepare('SELECT * FROM quizzes ORDER BY lesson_id IS NULL DESC, lesson_id ASC, position ASC').all();
res.render('quizzes/list',{ quizzes });
});


router.get('/:id/take', auth, (req,res)=>{
const q = db.prepare('SELECT * FROM quizzes WHERE id=?').get(req.params.id);
res.render('quizzes/take', { quiz:q, questions: JSON.parse(q.questions||'[]') });
});


router.post('/:id/submit', auth, (req,res)=>{
const quiz = db.prepare('SELECT * FROM quizzes WHERE id=?').get(req.params.id);
const qs = JSON.parse(quiz.questions||'[]');
let correct=0;
qs.forEach((q,i)=>{ if (Number(req.body[`q_${i}`]) === Number(q.answer)) correct++; });
const score = Math.round((correct/qs.length)*100);


// update user progress
const u = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
const hist = JSON.parse(u.completed_quizzes||'[]');
const idx = hist.findIndex(h=>h.quizId===quiz.id);
const rec = { quizId: quiz.id, score, completed: true };
if (idx>=0) hist[idx]=rec; else hist.push(rec);
db.prepare('UPDATE users SET completed_quizzes=? WHERE id=?')
.run(JSON.stringify(hist), req.user.id);


// award points per correct answer
for(let i=0;i<correct;i++) points.awardQuizCorrect(req.user.id);


req.flash('success',`Score: ${score}%`);
res.redirect('/quizzes');
});


// CRUD
router.get('/create/new', role('teacher','admin'), (req,res)=> res.render('quizzes/editor',{quiz:null}));
router.post('/create', role('teacher','admin'), (req,res)=>{
const { lesson_id, title, is_checkpoint, position, questions } = req.body;
db.prepare('INSERT INTO quizzes(lesson_id,title,is_checkpoint,position,questions) VALUES(?,?,?,?,?)')
.run(lesson_id||null, title, is_checkpoint?1:0, position||null, questions);
res.redirect('/quizzes');
});


module.exports = router;