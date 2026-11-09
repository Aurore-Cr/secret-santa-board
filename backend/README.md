# Secret Santa Board — Backend (volume 4)

API Express + SQLite pour huit membres et des invités « souhaits uniquement ».

## Installation

1. Installer Node.js LTS (version 22 ou ultérieure recommandée).
2. Ouvrir ce dossier dans VS Code.
3. `npm install`
4. Copier `.env.example` vers `.env` et remplacer `SESSION_SECRET` par une valeur aléatoire longue (ex. `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).
5. `npm run seed` (UNE SEULE FOIS, en développement) : noter les identifiants affichés.
6. `npm run dev`
7. Ouvrir `http://localhost:3001/api/health`.

## Connexion depuis React

`fetch('http://localhost:3001/api/auth/login', { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email,password}) })`.

**Important :** le frontend ZIP précédent est une maquette indépendante avec données fictives. Il faut remplacer ses données démo par des appels à cette API : le présent ZIP ne les branche pas automatiquement.

## Routes

- `POST /api/auth/login` : connexion.
- `GET /api/auth/me` : utilisateur connecté.
- `POST /api/auth/logout` : déconnexion.
- `GET /api/users` : membres visibles ; invité = soi-même.
- `POST /api/users` : administrateur crée un compte `family` ou `guest`.
- `GET /api/events` : événements.
- `GET /api/wishes/user/:userId` : souhaits (réservation uniquement pour les autres membres autorisés).
- `POST /api/wishes` : ajouter son propre souhait.
- `PATCH /api/wishes/:id` et `DELETE /api/wishes/:id` : modifier/supprimer son propre souhait.
- `POST /api/reservations/:wishId` : réserver pour autrui (pas invité).
- `PATCH /api/reservations/:wishId` : statut `reserved` / `purchased`, uniquement son achat.
- `DELETE /api/reservations/:wishId` : annuler sa propre réservation.

Les requêtes POST/PATCH/DELETE doivent fournir `Origin: http://localhost:5173` depuis le navigateur. Pour tester avec curl, ajouter `-H "Origin: http://localhost:5173"` et conserver les cookies avec `-c cookies.txt -b cookies.txt`.

## Sécurité et limites

- Le propriétaire ne reçoit jamais les champs `reservation` ; l'invité ne voit que sa propre liste.
- Mot de passe haché bcrypt ; session côté serveur SQLite ; cookie HttpOnly.
- L'admin ne contourne pas la confidentialité des listes qui lui appartiennent.
- Une réservation par cadeau, garantie par `UNIQUE(wish_id)`.
- Pour une vraie mise en ligne : HTTPS, domaine et origin exacts, sauvegardes, mises à jour, protection réseau, tests d'intégration et politique de restauration. Le proxy HTTPS doit être configuré avec soin.
- Les événements sont créés par le seed pour la démonstration ; l'interface d'administration des événements et les contributions partagées ne sont pas encore implémentées.
- `npm test` exécute des tests pédagogiques de règles ; ce ne sont PAS des tests de sécurité complets de l'API.
