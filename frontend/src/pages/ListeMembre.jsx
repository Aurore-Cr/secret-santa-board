import { Link, useParams } from 'react-router-dom';
import CarteCadeau from '../components/CarteCadeau.jsx';

export default function ListeMembre({ utilisateur, membres, cadeaux, onReserver, onAcheter }) {
  const { id } = useParams();
  const personne = membres.find((m) => m.id === Number(id) && m.role === 'membre');
  if (utilisateur.role !== 'membre' || !personne || personne.id === utilisateur.id) {
    return <main className="container"><h1>Accès non autorisé</h1><Link to="/">Retour</Link></main>;
  }
  const liste = cadeaux.filter((c) => c.destinataireId === personne.id);
  return (
    <main className="container pb-5">
      <h1 className="h2">{personne.emoji} Souhaits de {personne.nom}</h1>
      <p className="text-secondary">Vue organisateurs : statuts visibles seulement pour les autres membres.</p>
      <div className="row g-3">
        {liste.map((c) => <div className="col-md-6 col-lg-4" key={c.id}>
          <CarteCadeau cadeau={c} reserveur={membres.find((m) => m.id === c.reservePar)}
            onReserver={onReserver} onAcheter={onAcheter} />
        </div>)}
      </div>
      {liste.length === 0 && <p>Pas encore de souhaits.</p>}
    </main>
  );
}