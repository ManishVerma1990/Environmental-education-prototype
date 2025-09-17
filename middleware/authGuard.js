// authGuard.js
module.exports = function authGuard(req, res, next) {
if (req.isAuthenticated()) return next();
res.redirect('/login');
};


