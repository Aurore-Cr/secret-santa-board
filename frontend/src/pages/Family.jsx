import { useEffect, useState } from 'react';
import { api } from '../api';
import WishPhoto from '../components/WishPhoto';

export default function Family() {
 const [members,setMembers]=useState([]);
 const [selected,setSelected]=useState('');
 const [wishes,setWishes]=useState([]);
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 useEffect(()=>{api('/family/all').then(d=>setMembers(d.members)).catch(e=>setError(e.message));},[]);
 const choose=async id=>{
  setSelected(id);setError('');
  if(!id){setWishes([]);return;}
  try{setWishes((await api(`/family/${id}/wishes`)).wishes);}catch(e){setError(e.message);}
 };
 const action=async task=>{
  if(busy)return;setBusy(true);setError('');
  try{await task();await choose(selected);}catch(e){setError(e.message);}finally{setBusy(false);}
 };
 const reserve=id=>action(()=>api('/reservations',{method:'POST',body:{wishId:id}}));
 const purchased=id=>action(()=>api(`/reservations/${id}`,{method:'PATCH',body:{status:'purchased'}}));
 const cancel=id=>{
  if(!window.confirm('Annuler ta réservation ? Le cadeau redeviendra disponible pour les autres.'))return;
  action(()=>api(`/reservations/${id}`,{method:'DELETE'}));
 };
 return <section className="panel">
  <h1>Famille</h1>
  <p>Choisis un membre pour voir ses souhaits. Tes propres cadeaux restent invisibles.</p>
  <label>Choisir un membre
   <select value={selected} onChange={e=>choose(e.target.value)}>
    <option value="">Sélectionner</option>
    {members.map(m=><option key={m.id} value={m.id}>{m.display_name}</option>)}
   </select>
  </label>
  {error&&<p role="alert" className="error">{error}</p>}
  <div className="wish-grid">
   {wishes.map(w=><article className="wish-card" key={w.id}>
    {Boolean(w.has_image)&&<WishPhoto id={w.id} title={w.title}/>}
    <h3>{w.title}</h3>
    <p>{w.status==='purchased'?'Acheté':w.status==='reserved'?'Réservé':'Disponible'}</p>
    {!w.status&&<button disabled={busy} onClick={()=>reserve(w.id)}>Réserver</button>}
    {Boolean(w.reserved_by_me)&&w.status==='reserved'&&<button disabled={busy} onClick={()=>purchased(w.id)}>Marquer acheté</button>}
    {Boolean(w.reserved_by_me)&&<button disabled={busy} onClick={()=>cancel(w.id)}>Annuler ma réservation</button>}
   </article>)}
  </div>
 </section>;
}
