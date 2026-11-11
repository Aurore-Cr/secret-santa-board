# Secret Santa Board — kit 11 profils

## Important : intégration, pas remplacement aveugle
Ce kit est une **base autonome de référence** pour la nouvelle configuration. Il n'a pas été testé sur les fichiers réels de ton dépôt, auxquels nous n'avons pas accès. Il ne faut **pas écraser** le `backend/src/db/database.js` existant, ni les anciennes routes, ni le fichier SQLite de production. Le kit utilise volontairement `backend/src/db.js` et une nouvelle base `noel-11.sqlite`.

## 1. Sauvegarder l'existant AVANT toute opération
Dans VS Code, fermer les deux serveurs, puis dans PowerShell, à la racine de `secret-santa-board` :

```powershell
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
Copy-Item -LiteralPath .\backend -Destination "..\backend-sauvegarde-$stamp" -Recurse
Copy-Item -LiteralPath .\frontend -Destination "..\frontend-sauvegarde-$stamp" -Recurse
```

Ces copies contiennent potentiellement `.env`, la base SQLite et des mots de passe : **ne pas les publier sur Git ni les envoyer à d'autres membres**. Si tu as une base SQLite ouverte et en cours d'écriture, privilégie la commande `npm run backup` de l'ancien projet si elle existe et utilise l'API SQLite `backup()`. Une copie brute de SQLite en mode WAL pendant des écritures peut être incohérente. Le plus sûr pour la copie manuelle est d'arrêter le serveur au préalable.

## 2. Installer le kit dans un dossier de test séparé
Décompresser le ZIP **à côté** du dépôt, dans un dossier `secret-santa-11`, sans écraser le dépôt actuel.

### Backend
```powershell
cd .\secret-santa-11\backend
npm install
Copy-Item .env.example .env
```

Dans `backend/.env`, remplacer `SESSION_SECRET` par une valeur aléatoire d'au moins 32 caractères, par exemple générée avec :

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Ne pas partager cette valeur. Vérifier `FRONTEND_ORIGIN=http://localhost:5173`. Puis :

```powershell
npm run init
npm run dev
```

`npm run init` crée **exactement 11 profils**, un événement Noël 2026 et affiche **une seule fois** un code individuel pour chaque profil. Conserver les codes dans un endroit privé, les transmettre séparément. Cette commande refuse de s'exécuter si la base contient déjà des profils. Les enfants sont Louna et Anaé. Aurore est `admin` et reste également destinataire de souhaits.

### Frontend
Ce kit fournit les fichiers `src/` React à **copier dans un projet Vite React neuf** (il ne fournit pas le `package.json` de Vite). Depuis un dossier de test :

```powershell
npm create vite@latest frontend -- --template react
cd frontend
npm install
```

Copier les fichiers de `secret-santa-11/frontend/src` dans le `src` de ce projet Vite, conserver le `main.jsx` généré qui importe `App.jsx`. Copier `.env.example` en `.env`, puis :

```powershell
npm run dev
```

Ouvrir `http://localhost:5173`.

## 3. Comportement prévu
- Aucun endpoint d'inscription libre et aucune création de profil par un membre.
- Activation d'un profil précréé uniquement avec un code personnel fort à usage unique.
- Mot de passe personnel de 12 caractères minimum, haché par bcrypt.
- Session HTTP-only ; rotation de session à la connexion et à l'activation.
- Enfant : ajout/suppression de ses souhaits, consultation de son compte, changement de mot de passe ; aucune route de consultation des souhaits d'autrui ou de réservation.
- Adulte : consultation des listes d'autrui, y compris celles des enfants, et réservations ; impossible de voir les réservations de ses propres souhaits.
- Aurore : rôle admin, mêmes possibilités de souhaits personnels. Aucune interface d'administration de nouveaux profils n'est incluse : le nombre est volontairement figé.

## 4. Réinitialisation et restauration
La réinitialisation n'est **pas** automatisée et n'efface aucune donnée existante. Pour recommencer sur la base de test uniquement :

1. Arrêter le serveur de test.
2. Faire une sauvegarde cohérente : `npm run backup` (si la base de test existe et est accessible).
3. Vérifier le chemin `DB_FILE` dans `backend/.env`.
4. Renommer `backend/data/noel-11.sqlite` en `noel-11-archive.sqlite` **uniquement après arrêt du serveur**. Vérifier aussi les éventuels fichiers `-wal` et `-shm` : ils doivent être pris en compte dans la restauration d'une copie brute ; préférer une sauvegarde issue de `db.backup()`.
5. `npm run init` crée une base neuve. Les codes précédents ne fonctionneront plus.

Pour restaurer, arrêter le serveur et replacer la sauvegarde `.sqlite` à l'emplacement indiqué dans `DB_FILE` ; ne pas fusionner deux bases. Conserver l'archive hors du dépôt Git.

## 5. Contrôles indispensables
- Un enfant ne doit jamais recevoir les listes d'autres membres, même en appelant l'API directement.
- Un adulte ne doit jamais obtenir ses propres réservations ni l'identité de ses acheteurs.
- Un code d'activation utilisé ne doit plus fonctionner.
- Une douzième identité ne doit pas pouvoir être créée via l'API.
- Un mot de passe incorrect doit être refusé ; le changement de mot de passe exige l'ancien.
- Les opérations de réservation simultanées doivent respecter l'unicité SQLite.

## 6. Limites et points à terminer avant déploiement
Cette version de référence ne comprend pas la migration des anciennes listes, l'interface d'administration, la récupération de mot de passe, les tests automatisés, ni la configuration d'hébergement HTTPS. Elle doit être revue et testée avant publication. Les codes d'activation remis aux personnes doivent être transmis par canal privé ; le code ne protège pas contre une personne qui le vole. Pour une sécurité renforcée, ajouter une confirmation d'identité hors ligne, une révocation/régénération de codes réservée à l'admin, et un journal d'audit.

**Attention :** la liste publique des prénoms et le fait qu'un profil soit activé sont visibles sur l'écran de connexion ; c'est acceptable uniquement si cette divulgation convient à la famille. L'endpoint `/api/family/all` est réservé aux adultes. La réservation est masquée aux enfants au niveau serveur.
