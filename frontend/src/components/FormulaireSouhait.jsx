import { useState } from 'react';

export default function FormulaireSouhait({ onAjouter }) {
  const [titre, setTitre] = useState('');
  const [prix, setPrix] = useState('');
  function envoyer(e) {
    e.preventDefault();
    if (!titre.trim()) return;
    onAjouter({ titre: titre.trim(), prix: Number(prix) || 0 });
    setTitre(''); setPrix('');
  }
  return (
    <form className="carte-cadeau p-3 mb-4" onSubmit={envoyer}>
      <h2 className="h5">Ajouter un souhait</h2>
      <div className="row g-2">
        <div className="col-md-7"><input className="form-control" value={titre}
          onChange={(e) => setTitre(e.target.value)} placeholder="Ex. Livre fantasy" required /></div>
        <div className="col-md-3"><input className="form-control" type="number" min="0"
          value={prix} onChange={(e) => setPrix(e.target.value)} placeholder="Prix €" /></div>
        <div className="col-md-2"><button className="btn btn-noel w-100" type="submit">Ajouter</button></div>
      </div>
    </form>
  );
}