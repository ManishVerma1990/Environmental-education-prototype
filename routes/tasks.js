const router = require('express').Router();
const auth = require('../middleware/authGuard');
const role = require('../middleware/roleGuard');
const db = require('../config/db');
const points = require('../services/pointsService');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
// const { uploadToFirebase } = require('../config/firebase');
 const { uploadToCloudinary } = require('../config/cloudinary');

router.get('/', auth, (req,res)=>{
const tasks = db.prepare('SELECT * FROM tasks').all();
res.render('tasks/list',{ tasks });
});


router.get('/:id/submit', auth, (req,res)=>{
const task = db.prepare('SELECT * FROM tasks WHERE id=?').get(req.params.id);
res.render('tasks/submit',{ task });
});


router.post('/:id/submit', auth, upload.single('image'), async (req,res)=>{
const { description } = req.body; const { id } = req.params;
const fileUrl = await uploadToCloudinary(req.file.path);
db.prepare('INSERT INTO task_submissions(task_id,user_id,image_url,description) VALUES(?,?,?,?)')
.run(id, req.user.id, fileUrl, description);
req.flash('success','Submitted! Awaiting verification.');
res.redirect('/tasks');
});


// Teacher verify
router.get('/verify', role('teacher','admin'), (req,res)=>{
const subs = db.prepare('SELECT ts.*, u.name as student, t.points FROM task_submissions ts JOIN users u ON u.id=ts.user_id JOIN tasks t ON t.id=ts.task_id WHERE ts.verified=0').all();
res.render('tasks/verify',{ subs });
});


router.post('/:subId/verify', role('teacher','admin'), (req,res)=>{
const sub = db.prepare('SELECT * FROM task_submissions WHERE id=?').get(req.params.subId);
if (!sub) return res.status(404).send('Not found');
db.prepare('UPDATE task_submissions SET verified=1 WHERE id=?').run(sub.id);
// award custom points (from task table)
const pointsVal = db.prepare('SELECT points FROM tasks WHERE id=?').get(sub.task_id).points;
points.awardTask(sub.user_id, pointsVal);
req.flash('success','Submission verified & points awarded');
res.redirect('/tasks/verify');
});


module.exports = router;