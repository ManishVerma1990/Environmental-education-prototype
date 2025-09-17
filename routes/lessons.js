const router = require('express').Router();
const auth = require('../middleware/authGuard');
const role = require('../middleware/roleGuard');
const checkpointGuard = require('../middleware/checkpointGuard');
const db = require('../config/db');
const points = require('../services/pointsService');


router.get('/', auth, (req,res)=>{
const lessons = db.prepare('SELECT * FROM lessons').all();
res.render('lessons/list', { lessons });
});


router.get('/:id', auth, checkpointGuard, (req,res)=>{
const { id } = req.params; const r = Number(req.query.r||0);
const lesson = db.prepare('SELECT * FROM lessons WHERE id=?').get(id);
const resources = JSON.parse(lesson.resources||'[]');
const current = resources[r] || null;
const checkpoints = JSON.parse(lesson.checkpoints||'[]');
res.render('lessons/show', { lesson, resources, currentIndex:r, current, checkpoints });
});


// Mark completion (last resource viewed)
router.post('/:id/complete', auth, (req,res)=>{
const { id } = req.params;
const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
const cl = new Set(JSON.parse(user.completed_lessons||'[]')); cl.add(Number(id));
db.prepare('UPDATE users SET completed_lessons=? WHERE id=?').run(JSON.stringify(Array.from(cl)), req.user.id);
points.awardLessonCompletion(req.user.id);
res.redirect(`/lessons/${id}`);
});


// CRUD (teacher/admin)
// BEFORE: router.get('/create/new', role('teacher','admin'), (req,res)=> res.render('lessons/editor',{lesson:null}));
router.get('/create/new', role('teacher','admin'), (req,res)=>{
  const quizzes = db.prepare('SELECT id, title FROM quizzes ORDER BY id DESC').all();
  res.render('lessons/editor', { lesson: null, quizzes }); // pass quizzes to the view
});

// router.post('/create', role('teacher','admin'), (req,res)=>{
//     console.log(req.body);
// const { title, description, resources, checkpoints } = req.body;
// db.prepare('INSERT INTO lessons(title,description,resources,checkpoints) VALUES(?,?,?,?)')
// .run(title,description,resources,checkpoints);
// res.redirect('/lessons');
// });
// routes/lessons.js
router.post('/create', role('teacher','admin'), (req, res) => {
  const { title, description } = req.body;
  console.log(req.body);

  // normalize to arrays
  const toArr = v => (v == null ? [] : (Array.isArray(v) ? v : [v]));
  const types = toArr(req.body.res_type);     // e.g. ["video","pdf","imageSet"]
  const urls  = toArr(req.body.res_url);      // only for non-imageSet rows that were visible
  const imgs  = toArr(req.body.res_images);   // only for imageSet rows that were visible

  // Normalize common embed URLs (YouTube/Vimeo/Drive PDF)
  const toEmbed = (t, raw) => {
    if (!raw) return '';
    const url = String(raw).trim();

    if (t === 'video') {
      // youtu.be/<id>
      const mShort = url.match(/^https?:\/\/youtu\.be\/([^?&#]+)/i);
      if (mShort) return `https://www.youtube.com/embed/${mShort[1]}`;
      // youtube.com/watch?v=<id>
      const mWatch = url.match(/[?&]v=([^&#]+)/i);
      if (url.includes('youtube.com') && mWatch) return `https://www.youtube.com/embed/${mWatch[1]}`;
      // vimeo.com/<id>
      const mVimeo = url.match(/^https?:\/\/vimeo\.com\/(\d+)/i);
      if (mVimeo) return `https://player.vimeo.com/video/${mVimeo[1]}`;
    }

    if (t === 'pdf') {
      // Google Drive -> preview
      const mDrive = url.match(/\/file\/d\/([^/]+)/);
      if (mDrive) return `https://drive.google.com/file/d/${mDrive[1]}/preview`;
    }

    return url;
  };

  // Build resources using independent cursors
  let u = 0, im = 0;
  const resources = [];
  for (const t of types) {
    if (t === 'imageSet') {
      const rawList = imgs[im++] || '';
      const list = String(rawList).split(/\n|,/).map(s => s.trim()).filter(Boolean);
      if (list.length) resources.push({ type: 'imageSet', images: list });
    } else {
      const rawUrl = urls[u++] || '';
      const fixed = toEmbed(t, rawUrl);
      if (fixed) resources.push({ type: t, url: fixed });
    }
  }

  // checkpoints
  const cpQ = toArr(req.body.cp_quizId);
  const cpI = toArr(req.body.cp_afterIndex);
  const checkpoints = [];
  for (let i = 0; i < cpQ.length; i++) {
    const q = Number(cpQ[i]), idx = Number(cpI[i]);
    if (!Number.isNaN(q) && !Number.isNaN(idx)) {
      checkpoints.push({ quizId: q, afterResourceIndex: idx });
    }
  }

// EDIT form
router.get('/:id/edit', role('teacher','admin'), (req,res)=>{
  const lesson = db.prepare('SELECT * FROM lessons WHERE id=?').get(req.params.id);
  if (!lesson) return res.status(404).send('Lesson not found');
  const quizzes = db.prepare('SELECT id,title FROM quizzes ORDER BY id DESC').all();
  const resources = JSON.parse(lesson.resources || '[]');
  const checkpoints = JSON.parse(lesson.checkpoints || '[]');
  res.render('lessons/editor', { lesson, quizzes, resources, checkpoints });
});

// UPDATE
router.put('/:id', role('teacher','admin'), (req,res)=>{
  const { title, description } = req.body;

  const toArr = v => (v == null ? [] : (Array.isArray(v) ? v : [v]));
  const types = toArr(req.body.res_type);
  const urls  = toArr(req.body.res_url);
  const imgs  = toArr(req.body.res_images);

  const toEmbed = (t, raw) => {
    if (!raw) return '';
    const url = String(raw).trim();
    const mShort = url.match(/^https?:\/\/youtu\.be\/([^?&#]+)/i);
    if (t==='video' && mShort) return `https://www.youtube.com/embed/${mShort[1]}`;
    const mWatch = url.match(/[?&]v=([^&#]+)/i);
    if (t==='video' && url.includes('youtube.com') && mWatch) return `https://www.youtube.com/embed/${mWatch[1]}`;
    const mVimeo = url.match(/^https?:\/\/vimeo\.com\/(\d+)/i);
    if (t==='video' && mVimeo) return `https://player.vimeo.com/video/${mVimeo[1]}`;
    const mDrive = url.match(/\/file\/d\/([^/]+)/);
    if (t==='pdf' && mDrive) return `https://drive.google.com/file/d/${mDrive[1]}/preview`;
    return url;
  };

  let u=0, im=0;
  const resources = [];
  for (const t of types) {
    if (t === 'imageSet') {
      const rawList = imgs[im++] || '';
      const list = String(rawList).split(/\n|,/).map(s=>s.trim()).filter(Boolean);
      if (list.length) resources.push({ type:'imageSet', images:list });
    } else {
      const rawUrl = urls[u++] || '';
      const fixed = toEmbed(t, rawUrl);
      if (fixed) resources.push({ type:t, url:fixed });
    }
  }

  const cpQ = toArr(req.body.cp_quizId);
  const cpI = toArr(req.body.cp_afterIndex);
  const checkpoints = [];
  for (let i=0;i<cpQ.length;i++){
    const q = Number(cpQ[i]), idx = Number(cpI[i]);
    if (!Number.isNaN(q) && !Number.isNaN(idx)) checkpoints.push({ quizId:q, afterResourceIndex:idx });
  }

  db.prepare('UPDATE lessons SET title=?, description=?, resources=?, checkpoints=? WHERE id=?')
    .run(title, description, JSON.stringify(resources), JSON.stringify(checkpoints), req.params.id);

  req.flash('success','Lesson updated.');
  res.redirect('/lessons');
});

// DELETE
router.delete('/:id', role('teacher','admin'), (req,res)=>{
  db.prepare('DELETE FROM lessons WHERE id=?').run(req.params.id);
  req.flash('success','Lesson deleted.');
  res.redirect('/lessons');
});


  // save
  db.prepare('INSERT INTO lessons(title,description,resources,checkpoints) VALUES (?,?,?,?)')
    .run(title, description, JSON.stringify(resources), JSON.stringify(checkpoints));

  req.flash('success', `Lesson created with ${resources.length} resource(s).`);
  res.redirect('/lessons');
});


module.exports = router;
