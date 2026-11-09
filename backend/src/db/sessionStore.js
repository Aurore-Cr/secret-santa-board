import session from 'express-session';
import { db } from './database.js';
export class SqliteSessionStore extends session.Store {
 get(sid, callback) {
  try { const row = db.prepare('SELECT sess FROM sessions WHERE sid=? AND expires>?').get(sid, Date.now()); callback(null, row ? JSON.parse(row.sess) : null); }
  catch (error) { callback(error); }
 }
 set(sid, sess, callback = () => {}) {
  try { const expires = sess.cookie?.expires ? new Date(sess.cookie.expires).getTime() : Date.now() + 86400000;
   db.prepare('INSERT INTO sessions(sid,sess,expires) VALUES(?,?,?) ON CONFLICT(sid) DO UPDATE SET sess=excluded.sess,expires=excluded.expires').run(sid, JSON.stringify(sess), expires); callback(null); }
  catch (error) { callback(error); }
 }
 destroy(sid, callback = () => {}) {
  try { db.prepare('DELETE FROM sessions WHERE sid=?').run(sid); callback(null); }
  catch (error) { callback(error); }
 }
 touch(sid, sess, callback = () => {}) { this.set(sid, sess, callback); }
}
