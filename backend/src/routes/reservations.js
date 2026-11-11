import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
const router=Router();router.use(requireAuth);
function eligible(req,res) {
 if(req.user.role==='guest') {res.status(403).json({error:'Invité : souhaits uniquement'});return null;}
 const wish=db.prepare('SELECT * FROM wishes WHERE id=?').get(Number(req.params.wishId));
 if(!wish) {res.status(404).json({error:'Souhait introuvable'});return null;}
 if(wish.owner_id===req.user.id) {res.status(403).json({error:'Tu ne peux pas réserver tes propres cadeaux'});return null;}
 const owner=db.prepare('SELECT role FROM users WHERE id=?').get(wish.owner_id);
 if(owner?.role==='guest') {res.status(404).json({error:'Liste introuvable'});return null;}
 return wish;
}
router.post('/:wishId',(req,res)=>{
 if(!eligible(req,res)) return;
 try {db.prepare("INSERT INTO reservations(wish_id,buyer_id,status) VALUES(?,?,'reserved')").run(Number(req.params.wishId),req.user.id);res.status(201).json({ok:true,status:'reserved'});}
 catch(e){if(e.code?.startsWith('SQLITE_CONSTRAINT')) return res.status(409).json({error:'Cadeau déjà réservé'});throw e;}
});
router.patch('/:wishId',(req,res)=>{
 if(!eligible(req,res))return;
 const v=z.object({status:z.enum(['reserved','purchased'])}).safeParse(req.body);
 if(!v.success)return res.status(400).json({error:'Statut incorrect'});
 const row=db.prepare('SELECT buyer_id FROM reservations WHERE wish_id=?').get(Number(req.params.wishId));
 if(!row)return res.status(404).json({error:'Aucune réservation'});
 if(row.buyer_id!==req.user.id)return res.status(403).json({error:'Réservation d’un autre membre'});
 db.prepare('UPDATE reservations SET status=? WHERE wish_id=?').run(v.data.status,Number(req.params.wishId));res.json({ok:true,status:v.data.status});
});
router.delete('/:wishId',(req,res)=>{
 if(!eligible(req,res))return;
 const result=db.prepare('DELETE FROM reservations WHERE wish_id=? AND buyer_id=?').run(Number(req.params.wishId),req.user.id);
 if(!result.changes)return res.status(404).json({error:'Réservation personnelle introuvable'});
 res.json({ok:true});
});
export default router;
