const router = require('express').Router();
const role = require('../middleware/roleGuard');
const db = require('../config/db');
const { evaluateAndAssign, teacherAssign } = require('../services/badgeService');


router.get('/rules', role('teacher','admin'), (req,res)=>{
const all = db.prepare('SELECT * FROM badges').all();
res.render('badges/rules',{ badges: all });
});


router.post('/rules/create', role('teacher','admin'), (req,res)=>{
const { name, description, icon_url, criteria } = req.body;
db.prepare('INSERT INTO badges(name,description,icon_url,criteria) VALUES(?,?,?,?)')
.run(name,description,icon_url,criteria);
res.redirect('/badges/rules');
});


router.post('/evaluate/:userId', role('teacher','admin'), (req,res)=>{
evaluateAndAssign(req.params.userId);
res.redirect('/badges/rules');
});


router.post('/assign/:userId/:badgeId', role('teacher','admin'), (req,res)=>{
teacherAssign(Number(req.params.userId), Number(req.params.badgeId));
res.redirect('/badges/rules');
});


module.exports = router;