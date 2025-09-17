const router = require('express').Router();
const passport = require('passport');
const bcrypt = require('bcrypt');
const db = require('../config/db');


// GET /login – pass ?next through to the view
router.get('/login', (req, res) => {
  res.render('login', { next: req.query.next || '' });
});

// POST /login – custom callback so we can redirect to next (and support Remember me if you kept it)
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      req.flash('error', (info && info.message) || 'Invalid email or password');
      return res.redirect(`/login${req.body.next ? `?next=${encodeURIComponent(req.body.next)}` : ''}`);
    }
    req.logIn(user, (err) => {
      if (err) return next(err);

      // Optional: Remember me (if you added the checkbox earlier)
      if (req.body.remember) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      } else {
        req.session.cookie.expires = false;
        req.session.cookie.maxAge = null;
      }

      return res.redirect(req.body.next || '/dashboard');
    });
  })(req, res, next);
});



router.get('/register', (req,res)=> res.render('register'));
router.post('/register', async (req,res)=>{
const { name,email,password,role } = req.body;
const hash = await bcrypt.hash(password,10);
db.prepare('INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)').run(name,email,hash, role||'student');
res.redirect('/login');
});


router.get('/logout', (req,res)=>{ req.logout(()=>res.redirect('/')); });


module.exports = router;