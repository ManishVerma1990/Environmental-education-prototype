const db = require('../config/db');


function getUserStats(userId) {
const u = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
const completed_quizzes = JSON.parse(u.completed_quizzes || '[]');
const tasks = db.prepare('SELECT COUNT(*) c FROM task_submissions WHERE user_id=? AND verified=1').get(userId).c;
const avg = completed_quizzes.length
? completed_quizzes.reduce((a,q)=>a+(q.score||0),0)/completed_quizzes.length : 0;
const streak = 0; // plug your own streak logic
return { avg, tasks, streak, user: u };
}


function evaluateAndAssign(userId) {
const stats = getUserStats(userId);
const all = db.prepare('SELECT * FROM badges').all();
const current = new Set(JSON.parse(stats.user.badges || '[]'));
const newly = [];


for (const b of all) {
// Very simple criteria parser – replace with safe expression check
const pass = eval(b.criteria.replace(/quiz_avg/g, stats.avg)
.replace(/tasks_verified/g, stats.tasks)
.replace(/streak/g, stats.streak));
if (pass && !current.has(b.id)) {
current.add(b.id); newly.push(b.id);
}
}
if (newly.length) {
db.prepare('UPDATE users SET badges=? WHERE id=?')
.run(JSON.stringify(Array.from(current)), userId);
}
return newly;
}


function teacherAssign(userId, badgeId){
const u = db.prepare('SELECT * FROM users WHERE id=?').get(userId);
const set = new Set(JSON.parse(u.badges||'[]')); set.add(badgeId);
db.prepare('UPDATE users SET badges=? WHERE id=?')
.run(JSON.stringify(Array.from(set)), userId);
}


module.exports = { evaluateAndAssign, teacherAssign };