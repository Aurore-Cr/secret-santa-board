export async function api(path, options = {}) {
 const response = await fetch(`/api${path}`, { credentials: 'same-origin', ...options, headers: { ...(options.body ? {'Content-Type':'application/json'} : {}), ...options.headers } });
 let data; try { data = await response.json(); } catch { data = {}; }
 if (!response.ok) throw new Error(data.error || `Erreur HTTP ${response.status}`);
 return data;
}
export const json = (method, body) => ({ method, body: JSON.stringify(body) });
