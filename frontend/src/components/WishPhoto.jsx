import { useEffect, useState } from 'react';
import { fetchWishPhoto } from '../api';

export default function WishPhoto({ id, title }) {
 const [url, setUrl] = useState(null);
 const [error, setError] = useState('');
 const [open, setOpen] = useState(false);
 useEffect(() => {
  const controller = new AbortController();
  let currentUrl;
  setUrl(null); setError(''); setOpen(false);
  fetchWishPhoto(id, controller.signal).then(value => {
   if (controller.signal.aborted) { URL.revokeObjectURL(value); return; }
   currentUrl = value; setUrl(value);
  }).catch(e => { if (!controller.signal.aborted) setError(e.message); });
  return () => { controller.abort(); if (currentUrl) URL.revokeObjectURL(currentUrl); };
 }, [id]);
 if (error) return <p role="status" className="photo-error">Photo indisponible : {error}</p>;
 if (!url) return <p className="photo-loading">Chargement de la photo…</p>;
 return <>
  <button type="button" onClick={() => setOpen(true)} aria-label={`Agrandir la photo de ${title}`} style={{border:0,background:'transparent',padding:0,width:'100%',cursor:'zoom-in'}}>
   <img src={url} alt={`Photo de ${title}`} style={{width:'100%',height:180,objectFit:'contain',borderRadius:12}}/>
  </button>
  {open && <div role="presentation" onMouseDown={e => { if(e.target === e.currentTarget) setOpen(false); }} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.88)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
   <div role="dialog" aria-modal="true" aria-label={`Photo agrandie de ${title}`} style={{display:'flex',flexDirection:'column',alignItems:'flex-end',maxWidth:'95vw'}}>
    <button type="button" autoFocus onClick={() => setOpen(false)} style={{marginBottom:10}}>Fermer ✕</button>
    <img src={url} alt={`Photo de ${title}`} style={{maxWidth:'90vw',maxHeight:'80vh',objectFit:'contain'}}/>
   </div>
  </div>}
 </>;
}
