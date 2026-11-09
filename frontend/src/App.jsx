import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { membres, cadeauxInitiaux } from "./data/demo.js";
import Navbar from "./components/Navbar.jsx";
import MonEspace from "./pages/MonEspace.jsx";
import Famille from "./pages/Famille.jsx";
import ListeMembre from "./pages/ListeMembre.jsx";

export default function App() {
  const [utilisateur, setUtilisateur] = useState(membres[0]);
  const [cadeaux, setCadeaux] = useState(cadeauxInitiaux);

  function changerUtilisateur(id) {
    const membre = membres.find((m) => m.id === id);
    if (membre) setUtilisateur(membre);
  }

  function ajouterCadeau(nouveauCadeau) {
    setCadeaux((precedents) => [
      ...precedents,
      {
        ...nouveauCadeau,
        id: crypto.randomUUID(),
        destinataireId: utilisateur.id,
        statut: "disponible",
        reservePar: null,
      },
    ]);
  }

  function supprimerCadeau(id) {
    setCadeaux((precedents) =>
      precedents.filter(
        (cadeau) =>
          !(cadeau.id === id && cadeau.destinataireId === utilisateur.id),
      ),
    );
  }

  function reserverCadeau(id) {
    if (utilisateur.role !== "membre") return;
    setCadeaux((precedents) =>
      precedents.map((cadeau) =>
        cadeau.id === id &&
        cadeau.destinataireId !== utilisateur.id &&
        cadeau.statut === "disponible"
          ? { ...cadeau, statut: "reserve", reservePar: utilisateur.id }
          : cadeau,
      ),
    );
  }

  function acheterCadeau(id) {
    if (utilisateur.role !== "membre") return;
    setCadeaux((precedents) =>
      precedents.map((cadeau) =>
        cadeau.id === id &&
        cadeau.destinataireId !== utilisateur.id &&
        cadeau.statut === "reserve" &&
        cadeau.reservePar === utilisateur.id
          ? { ...cadeau, statut: "achete" }
          : cadeau,
      ),
    );
  }

  return (
    <>
      <Navbar
        utilisateur={utilisateur}
        membres={membres}
        onChanger={changerUtilisateur}
      />
      <Routes>
        <Route
          path="/"
          element={
            <MonEspace
              utilisateur={utilisateur}
              cadeaux={cadeaux}
              onAjouter={ajouterCadeau}
              onSupprimer={supprimerCadeau}
            />
          }
        />
        <Route
          path="/famille"
          element={
            utilisateur.role === "membre" ? (
              <Famille utilisateur={utilisateur} membres={membres} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/liste/:id"
          element={
            <ListeMembre
              utilisateur={utilisateur}
              membres={membres}
              cadeaux={cadeaux}
              onReserver={reserverCadeau}
              onAcheter={acheterCadeau}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
