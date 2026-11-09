import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import { SqliteSessionStore } from './db/sessionStore.js';
import auth from './routes/auth.js';
import users from './routes/users.js';
import events from './routes/events.js';
import wishes from './routes/wishes.js';
import reservations from './routes/reservations.js';
export const app=express();
const origin=process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const production=process.env.NODE_ENV==='production';
if(production)app.set('trust proxy',1); // seulement derrière un reverse proxy de confiance
app.use(helmet());
app.use(cors({origin,credentials:true}));
app.use(express.json({limit:'32kb'}));
// Vérifie l'Origin des écritures : complément à SameSite pour les cookies.
app.use((req,res,next)=>{
 if(['POST','PUT','PATCH','DELETE'].includes(req.method)){
  const requestOrigin=req.get('origin');
  if(requestOrigin!==origin)return res.status(403).json({error:'Origine non autorisée'});
 }
 next();
});
if(!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length<32) throw new Error('SESSION_SECRET absent ou trop court (min. 32 caractères)');
app.use(session({name:'noel.sid',secret:process.env.SESSION_SECRET,resave:false,saveUninitialized:false,store:new SqliteSessionStore(),cookie:{httpOnly:true,sameSite:'lax',secure:production,maxAge:24*60*60*1000}}));
app.get('/api/health',(_req,res)=>res.json({ok:true}));
app.use('/api/auth',rateLimit({windowMs:15*60*1000,limit:30,standardHeaders:'draft-7',legacyHeaders:false}),auth);
app.use('/api/users',users);
app.use('/api/events',events);
app.use('/api/wishes',wishes);
app.use('/api/reservations',reservations);
app.use((_req,res)=>res.status(404).json({error:'Route inconnue'}));
app.use((err,_req,res,_next)=>{console.error(err);res.status(500).json({error:'Erreur interne'});});
