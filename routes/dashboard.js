const router = require('express').Router();
const auth = require('../middleware/authGuard');
const db = require('../config/db');


router.get('/', auth, (req,res)=>{
const top = db.prepare('SELECT name, score FROM users ORDER BY score DESC LIMIT 10').all();
const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
const completed_lessons = JSON.parse(user.completed_lessons||'[]');
const completed_quizzes = JSON.parse(user.completed_quizzes||'[]');
const tasks = db.prepare('SELECT * FROM task_submissions WHERE user_id=?').all(req.user.id);


const view = req.user.role==='admin'?'admin':(req.user.role==='teacher'?'teacher':'student');
res.render(`dashboards/${view}`, { leaderboard: top, completed_lessons, completed_quizzes, tasks });
});


module.exports = router;