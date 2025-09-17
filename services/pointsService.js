const db = require('../config/db');


const addScore = (userId, delta) => {
db.prepare('UPDATE users SET score = score + ? WHERE id = ?').run(delta, userId);
};


module.exports = {
awardLessonCompletion(userId) { addScore(userId, 5); },
awardQuizCorrect(userId) { addScore(userId, 1); },
awardTask(userId, points) { addScore(userId, points); }
};