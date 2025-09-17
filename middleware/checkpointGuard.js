const db = require('../config/db');


module.exports = function checkpointGuard(req, res, next){
const { id } = req.params; // lesson id
const lesson = db.prepare('SELECT * FROM lessons WHERE id=?').get(id);
if (!lesson) return res.status(404).send('Lesson not found');


const checkpoints = JSON.parse(lesson.checkpoints || '[]');
if (!checkpoints.length) return next();


const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
const cq = new Set(JSON.parse(user.completed_quizzes || '[]').filter(q=>q.completed).map(q=>q.quizId));


// current resource index user is trying to access
const idx = Number(req.query.r || 0);


// find the nearest checkpoint at or before next index
for (const cp of checkpoints){
if (idx > cp.afterResourceIndex && !cq.has(cp.quizId)){
// block forward; allow backward (decrease r)
const allowedIndex = cp.afterResourceIndex; // cannot pass this without quiz
return res.redirect(`/lessons/${id}?r=${allowedIndex}`);
}
}
next();
}