import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { db } from '../src/db/database.js';
if(process.env.NODE_ENV==='production')throw new Error('Seed interdit en production');
const existing=db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
if(existing){console.log('Base déjà initialisée : aucune modification.');process.exit(0);}
const names=['Admin famille','Membre 2','Membre 3','Membre 4','Membre 5','Membre 6','Membre 7','Membre 8'];
const add=db.prepare('INSERT INTO users(display_name,email,password_hash,role) VALUES(?,?,?,?)');
for(let i=0;i<names.length;i++){
 const password=randomBytes(15).toString('base64url');
 const email=`membre${i+1}@exemple.test`;
 add.run(names[i],email,bcrypt.hashSync(password,12),i===0?'admin':'family');
 console.log(`${names[i]} | ${email} | mot de passe : ${password}`);
}
const guestPassword=randomBytes(15).toString('base64url');
add.run('Invité démo','invite@exemple.test',bcrypt.hashSync(guestPassword,12),'guest');
console.log(`Invité démo | invite@exemple.test | mot de passe : ${guestPassword}`);
db.prepare('INSERT INTO events(title,event_date) VALUES(?,?)').run('Noël 2026','2026-12-25');
console.log('Note les mots de passe dans un endroit privé ; ils ne seront pas réaffichés.');
