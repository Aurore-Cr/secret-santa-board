import { Link } from 'react-router-dom';

export default function Famille({ utilisateur, membres }) {
  const autres = membres.filter((m) => m.role === 'membre' && m.id !== utilisateur.id);
  return (
    <main className="container pb-5">
      <h1 className="h2 mb-2">Les listes de la famille</h1>
      <p className="text-secondary">Choisis une personne pour organiser ses cadeaux.</p>
      <div className="row g-3">
        {autres.map((m) => <div className="col-sm-6 col-lg-4" key={m.id}>
          <div className="carte-cadeau p-4 text-center">
            <div className="avatar-noel">{m.emoji}</div>
            <h2 className="h5">{m.nom}</h2>
            <Link className="btn btn-noel" to={`/liste/${m.id}`}>Voir ses souhaits</Link>
          </div>
        </div>)}
      </div>
    </main>
  );
}