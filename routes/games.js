const router = require('express').Router();
const auth = require('../middleware/authGuard');
const role = require('../middleware/roleGuard');
const db = require('../config/db');


router.get('/', auth, (req,res)=>{
const games = db.prepare('SELECT id, title, description, url FROM games').all();
res.render('games/list',{ games });
});


router.get('/create/new', role('teacher','admin'), (req,res)=> res.render('games/editor'));
router.post('/create', role('teacher','admin'), (req,res)=>{
const { title, description, url } = req.body;
db.prepare('CREATE TABLE IF NOT EXISTS games (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT, url TEXT)').run();
db.prepare('INSERT INTO games(title,description,url) VALUES(?,?,?)').run(title,description,url);
res.redirect('/games');
});


module.exports = router;