export default function CarteCadeau({ cadeau, proprietaire, reserveur, onReserver, onAcheter, onSupprimer }) {
  const etiquette = cadeau.statut === 'achete' ? 'Acheté' : cadeau.statut === 'reserve' ? 'Réservé' : 'Disponible';
  return (
    <article className="carte-cadeau p-3 h-100">
      <div className="icone-cadeau mb-3">🎁</div>
      <h3 className="h5">{cadeau.titre}</h3>
      <p className="text-secondary mb-2">Budget indicatif : {cadeau.prix} €</p>
      {!proprietaire && (
        <>
          <span className="badge badge-noel mb-2">{etiquette}</span>
          {reserveur && <p className="small mb-2">Réservé par {reserveur.nom}</p>}
          <div className="d-flex gap-2 flex-wrap">
            {cadeau.statut === 'disponible' && <button className="btn btn-noel btn-sm" onClick={() => onReserver(cadeau.id)}>Réserver</button>}
            {cadeau.statut === 'reserve' && <button className="btn btn-outline-success btn-sm" onClick={() => onAcheter(cadeau.id)}>Marquer acheté</button>}
          </div>
        </>
      )}
      {proprietaire && <button className="btn btn-outline-danger btn-sm" onClick={() => onSupprimer(cadeau.id)}>Supprimer mon souhait</button>}
    </article>
  );
}