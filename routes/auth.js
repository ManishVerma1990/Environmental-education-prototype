const router = require('express').Router();
const passport = require('passport');
const bcrypt = require('bcrypt');
const db = require('../config/db');


router.get('/login', (req,res)=> res.render('login'));
router.post('/login', passport.authenticate('local', { successRedirect:'/dashboard', failureRedirect:'/login', failureFlash:true }));


router.get('/register', (req,res)=> res.render('register'));
router.post('/register', async (req,res)=>{
const { name,email,password,role } = req.body;
const hash = await bcrypt.hash(password,10);
db.prepare('INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)').run(name,email,hash, role||'student');
res.redirect('/login');
});


router.get('/logout', (req,res)=>{ req.logout(()=>res.redirect('/login')); });


module.exports = router;