require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const methodOverride = require('method-override');
const db = require('./config/db');
const engine = require('ejs-mate');


// Run migration once
const sql = fs.readFileSync(path.join(__dirname,'migrations/001_init.sql'),'utf8');
sql.split(';').map(s=>s.trim()).filter(Boolean).forEach(stmt=>{ try{ db.prepare(stmt).run(); }catch(e){ /* ignore if exists */ }});


const app = express();
app.engine('ejs', engine); 
app.set('view engine','ejs');
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname,'public')));


app.use(session({ secret: process.env.SESSION_SECRET, resave:false, saveUninitialized:false }));
app.use(flash());
require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());


app.use((req,res,next)=>{ res.locals.user=req.user; res.locals.msg=req.flash(); next(); });


app.use('/', require('./routes/auth'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/lessons', require('./routes/lessons'));
app.use('/quizzes', require('./routes/quizzes'));
app.use('/tasks', require('./routes/tasks'));
app.use('/games', require('./routes/games'));
app.use('/admin', require('./routes/admin'));
app.use('/badges', require('./routes/badges'));


app.get('/', (req,res)=> res.redirect('/dashboard'));


const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`EcoLearn running on http://localhost:${PORT}`));