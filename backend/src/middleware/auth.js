import { db } from '../db/database.js';
export function requireAuth(req, res, next) {
 if (!req.session.userId) return res.status(401).json({ error: 'Connexion requise' });
 const user = db.prepare('SELECT id,display_name,email,role,birthday FROM users WHERE id=?').get(req.session.userId);
 if (!user) return res.status(401).json({ error: 'Session invalide' });
 req.user = user; next();
}
export function requireAdmin(req, res, next) {
 if (req.user.role !== 'admin') return res.status(403).json({ error: 'Administrateur uniquement' });
 next();
}
export const publicUser = ({ id, display_name, role, birthday }) => ({ id, display_name, role, birthday });
