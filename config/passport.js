const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const db = require('./db');


module.exports = (passport) => {
passport.use(new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
if (!row) return done(null, false, { message: 'Invalid email or password' });
bcrypt.compare(password, row.password_hash, (err, same) => {
if (err) return done(err);
if (!same) return done(null, false, { message: 'Invalid email or password' });
return done(null, row);
});
}));


passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
done(null, row);
});
};