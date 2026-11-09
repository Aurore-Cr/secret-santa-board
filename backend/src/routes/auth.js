import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db/database.js';
import { requireAuth, publicUser } from '../middleware/auth.js';
const router = Router();
const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
router.post('/login', (req, res, next) => {
 const parsed = schema.safeParse(req.body);
 if (!parsed.success) return res.status(400).json({ error: 'Identifiants invalides' });
 const user = db.prepare('SELECT * FROM users WHERE email=?').get(parsed.data.email.trim().toLowerCase());
 if (!user || !bcrypt.compareSync(parsed.data.password, user.password_hash)) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
 req.session.regenerate(err => {
  if (err) return next(err);
  req.session.userId = user.id;
  req.session.save(err2 => err2 ? next(err2) : res.json({ user: publicUser(user) }));
 });
});
router.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));
router.post('/logout', requireAuth, (req, res, next) => req.session.destroy(err => err ? next(err) : res.clearCookie('noel.sid').json({ ok: true })));
export default router;
