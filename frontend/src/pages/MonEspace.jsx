import FormulaireSouhait from '../components/FormulaireSouhait.jsx';
import CarteCadeau from '../components/CarteCadeau.jsx';

export default function MonEspace({ utilisateur, cadeaux, onAjouter, onSupprimer }) {
  const mesCadeaux = cadeaux.filter((c) => c.destinataireId === utilisateur.id);
  return (
    <main className="container pb-5">
      <div className="hero-noel p-4 p-md-5 mb-4">
        <p className="text-uppercase small mb-2">Mon espace personnel</p>
        <h1 className="display-6 fw-bold">Bonjour {utilisateur.emoji} {utilisateur.nom}</h1>
        <p className="mb-0">Ajoute tes envies. Les achats des autres restent secrets !</p>
      </div>
      <FormulaireSouhait onAjouter={onAjouter} />
      <h2 className="h4 mb-3">Ma liste de souhaits ({mesCadeaux.length})</h2>
      <div className="row g-3">
        {mesCadeaux.map((c) => <div className="col-md-6 col-lg-4" key={c.id}>
          <CarteCadeau cadeau={c} proprietaire onSupprimer={onSupprimer} />
        </div>)}
      </div>
      {mesCadeaux.length === 0 && <p>Aucun souhait pour le moment.</p>}
    </main>
  );
}