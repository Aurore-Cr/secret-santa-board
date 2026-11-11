// En production, utiliser le même domaine HTTPS que le backend.
const BASE = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:3001');
export async function api(path,{method='GET',body}={}){
 const response=await fetch(`${BASE}/api${path}`,{method,credentials:'include',headers:{...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(data.error||`HTTP ${response.status}`);
 return data;
}
export async function uploadWishPhoto(id,file){
 const mime=file.type;
 if(!['image/jpeg','image/png','image/webp'].includes(mime)) throw Error('Choisis une image JPEG, PNG ou WebP.');
 if(file.size>2*1024*1024) throw Error('La photo doit faire 2 Mo maximum.');
 const response=await fetch(`${BASE}/api/wishes/${id}/photo`,{method:'PUT',credentials:'include',headers:{'Content-Type':mime},body:file});
 const data=await response.json().catch(()=>({}));
 if(!response.ok) throw Error(data.error||`HTTP ${response.status}`);
 return data;
}
export function wishPhotoUrl(id){return `${BASE}/api/wishes/${id}/photo`;}

// Charge l'image avec le cookie de session et renvoie une URL locale temporaire.
export async function fetchWishPhoto(id, signal) {
 const response = await fetch(wishPhotoUrl(id), { credentials: 'include', signal, cache: 'no-store' });
 if (!response.ok) throw new Error(`Photo indisponible (HTTP ${response.status})`);
 const blob = await response.blob();
 if (!['image/jpeg','image/png','image/webp'].includes(blob.type)) throw new Error('Format de photo inattendu');
 return URL.createObjectURL(blob);
}
