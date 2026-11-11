import {useState} from 'react';
import {api} from '../api';
export default function Account({user}){
 const [currentPassword,setCurrent]=useState(''),[newPassword,setNew]=useState(''),[message,setMessage]=useState('');
 const save=async e=>{e.preventDefault();setMessage('');try{await api('/auth/password',{method:'POST',body:{currentPassword,newPassword}});setMessage('Mot de passe modifié');setCurrent('');setNew('');}catch(e){setMessage(e.message);}};
 return <section className="panel"><h1>Mon compte</h1><p>{user.name} · {user.role==='child'?'Enfant':user.role==='admin'?'Administratrice':'Adulte'}</p><form onSubmit={save}><label>Mot de passe actuel<input type="password" required value={currentPassword} onChange={e=>setCurrent(e.target.value)}/></label><label>Nouveau mot de passe (12 caractères minimum)<input type="password" minLength={12} required value={newPassword} onChange={e=>setNew(e.target.value)}/></label><button className="primary">Modifier mon mot de passe</button></form><p role="status">{message}</p></section>;
}
