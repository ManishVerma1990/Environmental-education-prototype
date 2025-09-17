const router = require('express').Router();
const role = require('../middleware/roleGuard');
const db = require('../config/db');


router.get('/users', role('admin'), (req,res)=>{
const users = db.prepare('SELECT id,name,email,role,score FROM users').all();
res.render('admin/users',{ users });
});


router.post('/users/:id/role', role('admin'), (req,res)=>{
db.prepare('UPDATE users SET role=? WHERE id=?').run(req.body.role, req.params.id);
res.redirect('/admin/users');
});


router.post('/users/:id/delete', role('admin'), (req,res)=>{
db.prepare('DELETE FROM users WHERE id=?').run(req.params.id);
res.redirect('/admin/users');
});


module.exports = router;