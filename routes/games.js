// routes/games.js
const router = require('express').Router();
const auth = require('../middleware/authGuard');
const role = require('../middleware/roleGuard');
const db = require('../config/db');

// list (unchanged)
router.get('/', auth, (req,res)=>{
  const games = db.prepare('SELECT * FROM games ORDER BY id DESC').all();
  res.render('games/list', { games });
});

// create (unchanged)
router.get('/create/new', role('teacher','admin'), (req,res)=>{
  res.render('games/editor');
});
router.post('/create', role('teacher','admin'), (req,res)=>{
  const { title, description, url } = req.body;
  db.prepare('INSERT INTO games(title, description, url) VALUES(?,?,?)').run(title, description, url);
  req.flash('success','Game added');
  res.redirect('/games');
});

// NEW: show game details page (no iframe)
router.get('/:id', auth, (req,res)=>{
  const game = db.prepare('SELECT * FROM games WHERE id=?').get(req.params.id);
  if (!game) return res.status(404).send('Game not found');
  res.render('games/show', { game });
});

module.exports = router;
