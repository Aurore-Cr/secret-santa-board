import session from 'express-session';
export class SqliteSessionStore extends session.Store {
 constructor(db){super();this.db=db;}
 get(sid,cb){try{const row=this.db.prepare('SELECT sess FROM sessions WHERE sid=? AND expires>?').get(sid,Date.now());cb(null,row?JSON.parse(row.sess):null);}catch(e){cb(e);}}
 set(sid,sess,cb){try{const expires=sess.cookie?.expires?new Date(sess.cookie.expires).getTime():Date.now()+86400000;this.db.prepare('INSERT INTO sessions(sid,sess,expires) VALUES(?,?,?) ON CONFLICT(sid) DO UPDATE SET sess=excluded.sess,expires=excluded.expires').run(sid,JSON.stringify(sess),expires);cb?.(null);}catch(e){cb?.(e);}}
 destroy(sid,cb){try{this.db.prepare('DELETE FROM sessions WHERE sid=?').run(sid);cb?.(null);}catch(e){cb?.(e);}}
 touch(sid,sess,cb){this.set(sid,sess,cb);}
}
