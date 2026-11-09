import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const { SESSION_SECRET, INVITATION_CODE, FRONTEND_ORIGIN = 'http://localhost:5173', NODE_ENV = 'development' } = process.env;
if (!SESSION_SECRET || SESSION_SECRET.length < 32 || !INVITATION_CODE || INVITATION_CODE.length < 12) {
  throw new Error('Configurer SESSION_SECRET (32+ caractères) et INVITATION_CODE (12+ caractères) dans backend/.env');
}
mkdirSync(new URL('../data/', import.meta.url), { recursive: true });
const db = new Database(fileURLToPath(new URL('../data/santa.sqlite', import.meta.url)));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(`
CREATE TABLE IF NOT EXISTS users (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT NOT NULL,
 email TEXT NOT NULL UNIQUE,
 password_hash TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS wishes (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 title TEXT NOT NULL,
 price REAL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS reservations (
 wish_id INTEGER PRIMARY KEY REFERENCES wishes(id) ON DELETE CASCADE,
 buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 status TEXT NOT NULL CHECK(status IN ('reserved','purchased')),
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', NODE_ENV === 'production' ? 1 : false);
app.use(helmet());
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json({ limit: '20kb' }));
// Pour un hébergement public, remplacer MemoryStore par un store de sessions persistant.
app.use(session({ name: 'santa.sid', secret: SESSION_SECRET, resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 } }));
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 15, standardHeaders: 'draft-7', legacyHeaders: false });
const safeUser = (u) => ({ id: u.id, name: u.name, email: u.email });
const requireAuth = (req, res, next) => req.session.userId ? next() : res.status(401).json({ error: 'Connexion requise.' });
const asyncRoute = (fn) => (req,res,next) => Promise.resolve(fn(req,res,next)).catch(next);
const sameSecret = (a, b) => { const x = Buffer.from(a); const y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };
const intId = (value) => { const n = Number(value); return Number.isSafeInteger(n) && n > 0 ? n : null; };
const wishView = (w) => ({ id: w.id, ownerId: w.owner_id, title: w.title, price: w.price, ...(w.owner_id === w.viewer_id ? {} : { status: w.status ?? 'available', reservedByMe: w.buyer_id === w.viewer_id }) });

app.post('/api/auth/register', authLimiter, asyncRoute(async (req, res) => {
 const { name, email, password, invitationCode } = req.body ?? {};
 if (typeof invitationCode !== 'string' || !sameSecret(invitationCode, INVITATION_CODE)) return res.status(403).json({ error: 'Code d’invitation invalide.' });
 const cleanName = typeof name === 'string' ? name.trim() : '';
 const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
 if (cleanName.length < 2 || cleanName.length > 60 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || typeof password !== 'string' || password.length < 12 || password.length > 128) return res.status(400).json({ error: 'Nom (2–60), e-mail valide et mot de passe (12–128 caractères) requis.' });
 if (db.prepare('SELECT id FROM users WHERE email=?').get(cleanEmail)) return res.status(409).json({ error: 'Adresse déjà utilisée.' });
 const hash = await bcrypt.hash(password, 12);
 const info = db.prepare('INSERT INTO users(name,email,password_hash) VALUES(?,?,?)').run(cleanName, cleanEmail, hash);
 req.session.regenerate((err) => { if (err) return res.status(500).json({error:'Session indisponible.'}); req.session.userId = info.lastInsertRowid; req.session.save((err2) => err2 ? res.status(500).json({error:'Session indisponible.'}) : res.status(201).json({ user: {id: Number(info.lastInsertRowid),name:cleanName,email:cleanEmail} })); });
}));
app.post('/api/auth/login', authLimiter, asyncRoute(async (req, res) => {
 const { email, password } = req.body ?? {};
 const u = typeof email === 'string' ? db.prepare('SELECT * FROM users WHERE email=?').get(email.trim().toLowerCase()) : null;
 if (!u || typeof password !== 'string' || !(await bcrypt.compare(password, u.password_hash))) return res.status(401).json({ error: 'Identifiants incorrects.' });
 req.session.regenerate((err) => { if (err) return res.status(500).json({error:'Session indisponible.'}); req.session.userId = u.id; req.session.save((err2) => err2 ? res.status(500).json({error:'Session indisponible.'}) : res.json({user:safeUser(u)})); });
}));
app.post('/api/auth/logout', requireAuth, (req, res) => req.session.destroy((err) => { if (err) return res.status(500).json({error:'Déconnexion impossible.'}); res.clearCookie('santa.sid'); res.json({ok:true}); }));
app.get('/api/auth/me', requireAuth, (req,res) => { const u=db.prepare('SELECT * FROM users WHERE id=?').get(req.session.userId); if(!u) return res.status(401).json({error:'Compte introuvable.'}); res.json({user:safeUser(u)}); });
app.get('/api/members', requireAuth, (req,res) => res.json(db.prepare('SELECT id,name FROM users WHERE id != ? ORDER BY name').all(req.session.userId)));
app.get('/api/wishes/me', requireAuth, (req,res) => res.json(db.prepare('SELECT id,owner_id AS ownerId,title,price FROM wishes WHERE owner_id=? ORDER BY id DESC').all(req.session.userId)));
app.post('/api/wishes', requireAuth, (req,res) => { const title=typeof req.body?.title==='string'?req.body.title.trim():''; const p=req.body?.price; const price=p===''||p==null?null:Number(p); if(!title||title.length>150|| (price!==null&&(!Number.isFinite(price)||price<0||price>100000))) return res.status(400).json({error:'Souhait ou prix invalide.'}); const info=db.prepare('INSERT INTO wishes(owner_id,title,price) VALUES(?,?,?)').run(req.session.userId,title,price); res.status(201).json({id:Number(info.lastInsertRowid),ownerId:req.session.userId,title,price}); });
app.delete('/api/wishes/:id', requireAuth, (req,res) => { const id=intId(req.params.id); if(!id)return res.status(400).json({error:'ID invalide.'}); const result=db.prepare('DELETE FROM wishes WHERE id=? AND owner_id=?').run(id,req.session.userId); res.status(result.changes?200:404).json(result.changes?{ok:true}:{error:'Souhait introuvable.'}); });
app.get('/api/members/:id/wishes', requireAuth, (req,res) => { const id=intId(req.params.id); if(!id||id===req.session.userId)return res.status(403).json({error:'Accès interdit.'}); if(!db.prepare('SELECT id FROM users WHERE id=?').get(id))return res.status(404).json({error:'Membre introuvable.'}); const rows=db.prepare(`SELECT w.id,w.owner_id,w.title,w.price,r.status,r.buyer_id,? AS viewer_id FROM wishes w LEFT JOIN reservations r ON r.wish_id=w.id WHERE w.owner_id=? ORDER BY w.id DESC`).all(req.session.userId,id); res.json(rows.map(wishView)); });
app.post('/api/wishes/:id/reservation', requireAuth, (req,res) => { const id=intId(req.params.id); const status=req.body?.status; if(!id||!['reserved','purchased','release'].includes(status))return res.status(400).json({error:'Requête invalide.'}); const w=db.prepare('SELECT owner_id FROM wishes WHERE id=?').get(id); if(!w)return res.status(404).json({error:'Souhait introuvable.'}); if(w.owner_id===req.session.userId)return res.status(403).json({error:'Impossible de réserver son propre cadeau.'}); const existing=db.prepare('SELECT * FROM reservations WHERE wish_id=?').get(id); if(status==='release'){if(!existing||existing.buyer_id!==req.session.userId)return res.status(403).json({error:'Réservation non détenue.'});db.prepare('DELETE FROM reservations WHERE wish_id=?').run(id);return res.json({ok:true});} if(existing&&existing.buyer_id!==req.session.userId)return res.status(409).json({error:'Ce souhait est déjà réservé.'}); if(existing)db.prepare('UPDATE reservations SET status=?,updated_at=CURRENT_TIMESTAMP WHERE wish_id=?').run(status,id); else db.prepare('INSERT INTO reservations(wish_id,buyer_id,status) VALUES(?,?,?)').run(id,req.session.userId,status); res.json({ok:true}); });
app.use((err,req,res,next)=>{console.error(err);res.status(500).json({error:'Erreur serveur.'});});
app.listen(Number(process.env.PORT)||3001,()=>console.log('API démarrée sur http://localhost:'+(Number(process.env.PORT)||3001)));
