// // authGuard.js
// module.exports = function authGuard(req, res, next) {
// if (req.isAuthenticated()) return next();
// res.redirect('/login');
// };

// middleware/authGuard.js
module.exports = function authGuard(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  const nextUrl = encodeURIComponent(req.originalUrl || '/dashboard');
  return res.redirect(`/?next=${nextUrl}`);
};

