import {useEffect,useState} from 'react';
import {api} from './api';
import Access from './pages/Access';
import Navigation from './components/Navigation';
import Account from './pages/Account';
import MyWishes from './pages/MyWishes';
import Family from './pages/Family';
import './christmas.css';
export default function App(){
 const [user,setUser]=useState(null),[loading,setLoading]=useState(true),[page,setPage]=useState('mine');
 useEffect(()=>{api('/auth/me').then(d=>setUser(d.user)).catch(()=>{}).finally(()=>setLoading(false));},[]);
 const logout=async()=>{try{await api('/auth/logout',{method:'POST'});}finally{setUser(null);setPage('mine');}};
 if(loading)return <p>Chargement…</p>;
 if(!user)return <Access onSuccess={setUser}/>;
 return <><Navigation user={user} onNavigate={setPage} onLogout={logout}/><main className="content">{page==='account'?<Account user={user}/>:page==='family'&&user.role!=='child'?<Family/>:<MyWishes/>}</main></>;
}
