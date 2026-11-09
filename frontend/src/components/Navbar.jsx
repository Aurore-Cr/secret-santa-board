import { Link, NavLink } from "react-router-dom";

export default function Navbar({ utilisateur, membres = [], onChanger }) {
  return (
    <header className="navbar-noel py-3 mb-4">
      <div className="container d-flex flex-wrap gap-3 align-items-center justify-content-between">
        <Link to="/" className="text-decoration-none marque">
          🎄 Secret Santa Board
        </Link>
        <nav className="d-flex flex-wrap gap-3">
          <NavLink to="/" className="lien-nav">
            Mon espace
          </NavLink>
          {utilisateur.role === "membre" && (
            <NavLink to="/famille" className="lien-nav">
              Famille
            </NavLink>
          )}
        </nav>
        <label className="d-flex align-items-center gap-2 text-white">
          <span className="small">Démo :</span>
          <select
            className="form-select form-select-sm"
            value={utilisateur.id}
            onChange={(e) => onChanger(Number(e.target.value))}
          >
            {membres.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nom}
              </option>
            ))}
          </select>
        </label>
      </div>
    </header>
  );
}
