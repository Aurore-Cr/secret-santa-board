import { Router } from 'express';
import { db } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
const router=Router(); router.use(requireAuth);
router.get('/', (req,res) => res.json({ events: db.prepare('SELECT id,title,event_date FROM events ORDER BY id DESC').all() }));
export default router;
