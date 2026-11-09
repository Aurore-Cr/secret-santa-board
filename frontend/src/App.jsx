import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { api } from './lib/api.js';
import Navbar from './components/Navbar.jsx';
import Auth from './pages/Auth.jsx';
import MonEspace from './pages/MonEspace.jsx';
import Famille from './pages/Famille.jsx';
import ListeMembre from './pages/ListeMembre.jsx';
export default function App(){
 const [user,setUser]=useState(null); const [loading,setLoading]=useState(true);
 useEffect(()=>{api('/auth/me').then(d=>setUser(d.user)).catch(()=>setUser(null)).finally(()=>setLoading(false));},[]);
 if(loading)return <div className="container py-5">Chargement…</div>;
 if(!user)return <Auth onAuthenticated={setUser}/>;
 return <><Navbar user={user} onLogout={async()=>{await api('/auth/logout',{method:'POST'});setUser(null);}}/><Routes><Route path="/" element={<MonEspace/>}/><Route path="/famille" element={<Famille/>}/><Route path="/liste/:id" element={<ListeMembre/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></>;
}
