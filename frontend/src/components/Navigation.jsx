import {useState} from 'react';
export default function Navigation({user,onNavigate,onLogout}){
 const [open,setOpen]=useState(false);
 const go=page=>{setOpen(false);onNavigate(page);};
 return <header className="christmas-header"><div className="nav-inner"><strong>🎁 Secret Santa Board</strong><button type="button" className="burger" aria-label="Ouvrir le menu" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>☰</button><nav className={open?'open':''} aria-label="Navigation principale"><button onClick={()=>go('mine')}>Mes souhaits</button>{user.role!=='child'&&<button onClick={()=>go('family')}>Famille</button>}<button onClick={()=>go('account')}>Mon compte</button><button onClick={onLogout}>Déconnexion</button></nav></div></header>;
}
