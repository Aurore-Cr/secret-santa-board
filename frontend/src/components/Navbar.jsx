import { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
export default function Navbar({user,onLogout}){
 const [open,setOpen]=useState(false); const location=useLocation();
 const close=()=>setOpen(false);
 return <header className="site-header"><div className="container nav-shell">
  <Link to="/" className="brand" onClick={close}><i className="bi bi-gift-fill"/> Secret Santa Board</Link>
  <button className="menu-toggle" aria-label={open?'Fermer le menu':'Ouvrir le menu'} aria-expanded={open} aria-controls="main-navigation" onClick={()=>setOpen(!open)}><i className={`bi ${open?'bi-x-lg':'bi-list'}`}/></button>
  <nav id="main-navigation" className={`site-nav ${open?'is-open':''}`} aria-label="Navigation principale">
   <NavLink to="/" end onClick={close}>Mon espace</NavLink><NavLink to="/famille" onClick={close}>Famille</NavLink>
   <span className="nav-user"><i className="bi bi-person-circle"/> {user.name}</span>
   <button className="btn btn-outline-light btn-sm" onClick={async()=>{close();try{await onLogout();}catch(e){alert(e.message);}}}>Déconnexion</button>
  </nav>
 </div></header>;
}
