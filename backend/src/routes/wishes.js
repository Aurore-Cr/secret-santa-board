import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router(); router.use(requireAuth);
const wishSchema = z.object({ event_id: z.number().int().positive(), title: z.string().trim().min(1).max(160), description: z.string().max(1500).default(''), product_url: z.union([z.literal(''), z.string().url().max(2000)]).default(''), image_url: z.union([z.literal(''), z.string().url().max(2000)]).default(''), price_cents: z.number().int().nonnegative().nullable().default(null) });
function readWish(id) { return db.prepare('SELECT * FROM wishes WHERE id=?').get(id); }
function visibleWish(wish, viewer) {
 const { id,owner_id,event_id,title,description,product_url,image_url,price_cents,created_at } = wish;
 const base={ id,owner_id,event_id,title,description,product_url,image_url,price_cents,created_at };
 if (viewer.id === owner_id || viewer.role === 'guest') return base;
 const reservation = db.prepare('SELECT buyer_id,status FROM reservations WHERE wish_id=?').get(id);
 return { ...base, reservation: reservation ?? null };
}
router.get('/user/:userId', (req,res) => {
 const ownerId=Number(req.params.userId);
 if (!Number.isSafeInteger(ownerId) || ownerId <= 0) return res.status(400).json({ error:'ID incorrect' });
 if (req.user.role === 'guest' && ownerId !== req.user.id) return res.status(403).json({ error:'Accès interdit' });
 const owner=db.prepare('SELECT id,role FROM users WHERE id=?').get(ownerId);
 if (!owner || (owner.role === 'guest' && ownerId !== req.user.id)) return res.status(404).json({ error:'Liste introuvable' });
 const wishes=db.prepare('SELECT * FROM wishes WHERE owner_id=? ORDER BY id DESC').all(ownerId);
 res.json({ wishes:wishes.map(w=>visibleWish(w,req.user)) });
});
router.post('/', (req,res) => {
 const v=wishSchema.safeParse(req.body);
 if (!v.success) return res.status(400).json({ error:'Souhait invalide',details:v.error.flatten() });
 if (!db.prepare('SELECT id FROM events WHERE id=?').get(v.data.event_id)) return res.status(404).json({ error:'Événement introuvable' });
 const x=v.data;
 const info=db.prepare('INSERT INTO wishes(owner_id,event_id,title,description,product_url,image_url,price_cents) VALUES(?,?,?,?,?,?,?)').run(req.user.id,x.event_id,x.title,x.description,x.product_url,x.image_url,x.price_cents);
 res.status(201).json({ wish:visibleWish(readWish(info.lastInsertRowid),req.user) });
});
router.patch('/:id', (req,res) => {
 const wish=readWish(Number(req.params.id));
 if (!wish) return res.status(404).json({error:'Souhait introuvable'});
 if (wish.owner_id !== req.user.id) return res.status(403).json({error:'Modification interdite'});
 const v=wishSchema.partial().safeParse(req.body);
 if (!v.success || Object.keys(v.data ?? {}).length===0) return res.status(400).json({error:'Champs invalides'});
 if (v.data.event_id && !db.prepare('SELECT id FROM events WHERE id=?').get(v.data.event_id)) return res.status(404).json({error:'Événement introuvable'});
 const keys=Object.keys(v.data); db.prepare(`UPDATE wishes SET ${keys.map(k=>k+'=?').join(',')} WHERE id=?`).run(...keys.map(k=>v.data[k]),wish.id);
 res.json({wish:visibleWish(readWish(wish.id),req.user)});
});
router.delete('/:id',(req,res)=>{
 const wish=readWish(Number(req.params.id));
 if(!wish) return res.status(404).json({error:'Souhait introuvable'});
 if(wish.owner_id!==req.user.id) return res.status(403).json({error:'Suppression interdite'});
 db.prepare('DELETE FROM wishes WHERE id=?').run(wish.id);res.json({ok:true});
});
export default router;
