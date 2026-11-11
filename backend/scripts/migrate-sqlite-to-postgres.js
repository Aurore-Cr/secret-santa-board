import 'dotenv/config';
import Database from 'better-sqlite3';
import {pool,initSchema} from '../src/db.js';
import fs from 'node:fs';
import path from 'node:path';
const file=path.resolve(process.env.SQLITE_SOURCE||'./data/noel-11.sqlite');
if(!fs.existsSync(file))throw Error(`Base SQLite introuvable : ${file}`);
const sqlite=new Database(file,{readonly:true,fileMustExist:true});
await initSchema();
const client=await pool.connect();
try{
 await client.query('BEGIN');
 const tables=['users','events','wishes','reservations'];
 for(const table of tables){const {rows}=await client.query(`SELECT COUNT(*)::int AS count FROM ${table}`);if(rows[0].count!==0)throw Error(`PostgreSQL contient déjà ${rows[0].count} lignes dans ${table}. Migration interrompue sans écrasement.`);}
 const fields={users:['id','display_name','role','password_hash','activation_hash','activated_at','created_at'],events:['id','title','event_date'],wishes:['id','owner_id','event_id','title','description','price_cents','created_at','image_data','image_mime'],reservations:['id','wish_id','buyer_id','status','created_at']};
 const counts={};
 for(const table of tables){const cols=fields[table];const existing=new Set(sqlite.prepare(`PRAGMA table_info(${table})`).all().map(x=>x.name));const selected=cols.filter(x=>existing.has(x));const rows=sqlite.prepare(`SELECT ${selected.join(',')} FROM ${table}`).all();for(const row of rows){const values=cols.map(x=>row[x]??null);const sql=`INSERT INTO ${table} (${cols.join(',')}) VALUES (${cols.map((_,i)=>'$'+(i+1)).join(',')})`;await client.query(sql,values);}counts[table]=rows.length;await client.query(`SELECT setval(pg_get_serial_sequence('${table}','id'),COALESCE((SELECT MAX(id) FROM ${table}),1),(SELECT COUNT(*)>0 FROM ${table}))`);}
 for(const table of tables){const {rows}=await client.query(`SELECT COUNT(*)::int AS count FROM ${table}`);if(rows[0].count!==counts[table])throw Error(`Nombre de lignes incohérent pour ${table}`);}
 await client.query('COMMIT');console.log('Migration validée :',counts);
}catch(e){await client.query('ROLLBACK');console.error('Migration annulée :',e.message);process.exitCode=1;}finally{client.release();sqlite.close();await pool.end();}
