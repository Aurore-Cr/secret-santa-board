# Secret Santa Board — Photos, favicon et Render

## Installer sur ton projet existant
1. Arrêter backend et frontend.
2. Décompresser l'archive à côté de `secret-santa-board`.
3. Dans PowerShell, depuis le dossier extrait, exécuter `./INSTALLER.ps1`. Indiquer le chemin du projet.
4. L'installateur sauvegarde chaque fichier remplacé dans `sauvegarde-photos-AAAA...` dans ton projet. Il ne touche ni à `.env`, ni aux fichiers SQLite.
5. Lancer le backend `npm run dev` et le frontend `npm run dev` dans leurs dossiers respectifs.
6. Tester l'ajout de souhait avec photo, son affichage dans « Famille », la suppression, et les permissions enfant.

**Photo** : JPEG/PNG/WebP de 2 Mio maximum, conservée dans SQLite, accessible uniquement après connexion. La photo est facultative. Pour une photo plus grande, compresser avant de l'ajouter. Une photo est aussi remplaçable depuis « Ma liste ».

**Favicon** : `frontend/public/favicon.svg` et sa référence dans `frontend/index.html`.

## Render : une seule Web Service Node
Le code fourni sert le frontend compilé depuis Express, sur le même domaine que l'API. Il faut déployer **le projet complet** sur un dépôt Git privé (ne jamais y ajouter `.env`, `backend/data`, sauvegardes, codes privés, `node_modules`).

Sur Render : New > Web Service > dépôt Git privé.
- Root Directory : **laisser vide** (racine du dépôt).
- Build Command : `npm --prefix backend ci && npm --prefix frontend ci && npm --prefix frontend run build`
- Start Command : `cd backend && npm start`
- Variables d'environnement : `NODE_ENV=production`, `SESSION_SECRET` (nouveau secret aléatoire d'au moins 32 caractères), `DB_FILE=/var/data/noel-11.sqlite`, `FRONTEND_ORIGIN=https://TON-SERVICE.onrender.com` (adapter à l'URL exacte).
- Ajouter un **Persistent Disk** monté sur `/var/data` (selon les offres Render disponibles). SQLite + photos sont sur ce disque. **Sans disque persistant, ne pas utiliser pour les comptes de famille.**
- Health Check Path : `/api/health`.
- Si un domaine personnalisé est utilisé, `FRONTEND_ORIGIN` doit correspondre exactement à ce domaine, avec `https://`.

### Transférer les onze profils existants
Le disque Render démarre vide. Copier la base SQLite existante **après arrêt du backend local** en prenant en compte les fichiers `-wal` et `-shm` ou, de préférence, avec l'API SQLite `backup()` vers un fichier cohérent. Restaurer ce fichier comme `/var/data/noel-11.sqlite` avant de démarrer le service. **Ne pas lancer `npm run init`** et ne pas recréer les onze profils si l'objectif est de conserver les mots de passe existants. Les codes d'activation déjà utilisés ne sont plus nécessaires.

Render ne permet pas forcément d'envoyer un fichier directement sur un disque via son interface : prévoir un transfert sûr (shell/SSH si disponible, ou migration temporaire contrôlée). Ne jamais mettre la base privée dans Git ou dans une URL publique. Si tu n'as pas encore de méthode de transfert sûre, reporte le déploiement plutôt que de recréer des comptes.

### Vérifications avant partage
- Le site charge en HTTPS et les onze profils sont présents.
- Connexion et déconnexion, souhaits et photos, réservation depuis un autre adulte.
- Le propriétaire ne voit jamais qui a réservé ses cadeaux.
- Un enfant ne peut pas accéder aux listes d'autrui ni aux photos via l'API.
- Redémarrage Render sans perte de profils/photos.
- Sauvegarde hors du disque Render et restauration testée.

### Limites
Ce kit ne déploie pas automatiquement sur Render, ne transfère pas la base existante et n'inclut pas de tests d'intégration de bout en bout. Il n'installe pas de dépendance supplémentaire. Le backend ne sert le frontend que lorsque `frontend/dist/index.html` existe.
