# Secret Santa Board — migration PostgreSQL / Render gratuit

## Contenu
Ce ZIP est un **correctif à superposer au projet local existant**, et non un projet React complet. Les pages React existantes restent inchangées. Les photos sont stockées directement dans PostgreSQL (`BYTEA`) et non sur le disque Render. Les réservations, comptes, événements et sessions sont persistants dans PostgreSQL.

## 1. Sauvegarde indispensable
Fermer les serveurs locaux. Faire une copie intégrale du dossier actuel, notamment `backend/data/noel-11.sqlite` (ne jamais publier cette base sur GitHub). Ne jamais supprimer la copie SQLite d'origine.

## 2. Installer le correctif
Copier `backend/src/server.js`, `backend/src/db.js`, `backend/scripts/migrate-sqlite-to-postgres.js`, `backend/package.json`, `.gitignore` et `render.yaml` aux mêmes emplacements du projet local. Ne pas supprimer le frontend. Dans `backend` : `npm install` pour générer le nouveau `package-lock.json`.

## 3. Créer PostgreSQL
Créer un projet PostgreSQL sur https://neon.tech/ (offre gratuite selon quotas). Copier sa chaîne de connexion `postgresql://...` dans **backend/.env** sous `DATABASE_URL=...`. Ajouter `SESSION_SECRET=` avec au moins 32 caractères aléatoires. Ne jamais publier `.env`.

## 4. Migration UNIQUE des données
Dans PowerShell, depuis `backend`, définir le chemin exact de la base existante (si différent de `backend/data/noel-11.sqlite`) :

`$env:SQLITE_SOURCE="C:\\chemin\\secret-santa-board\\backend\\data\\noel-11.sqlite"`

Puis : `npm run migrate:postgres`.

Le script crée les tables si nécessaire, refuse une destination non vide, copie profils, événements, souhaits, images et réservations, vérifie les comptes de lignes et annule la transaction en cas d'erreur. Les sessions précédentes ne sont pas transférées : les membres se reconnecteront. Vérifier le résultat affiché et tester localement avant de déployer.

## 5. Tester en local
Depuis `backend` : `npm run dev`. Depuis `frontend` : `npm run dev`. Vérifier les profils, la connexion, les souhaits, l'affichage et l'agrandissement des photos, la réservation, l'annulation et l'interdiction de voir qui réserve son propre cadeau.

## 6. GitHub
Dans la racine du projet, `git status` et contrôler qu'aucun fichier `.env`, `.sqlite`, photo privée, ou sauvegarde n'est suivi. Si une donnée sensible est **déjà** suivie, `.gitignore` ne suffit pas : la retirer de l'index avec `git rm --cached <chemin>` et traiter les secrets exposés. Puis `git add .`, `git commit -m "Migration PostgreSQL Render gratuit"`, `git push origin main`.

## 7. Render
Créer un Web Service à partir du dépôt GitHub ou utiliser le fichier `render.yaml`. Paramètres : root directory vide ; build `npm --prefix backend install && npm --prefix frontend ci && npm --prefix frontend run build` ; start `npm --prefix backend start` ; health `/api/health`. Variables : `DATABASE_URL` (même base Neon que la migration), `SESSION_SECRET` (>=32 caractères), `NODE_ENV=production`. Le domaine HTTPS de Render est utilisé automatiquement. Ne pas définir `FRONTEND_ORIGIN` sauf si nécessaire : si définie, elle doit être l'URL publique exacte sans slash final.

## 8. Vérification finale
Après publication : connexion avec un profil existant, lecture des cadeaux, photo, réservation, annulation. Déclencher un redéploiement Render et vérifier que les mêmes données existent toujours. Mettre en place des sauvegardes exportées de Neon (la persistance n'est pas une sauvegarde). Ne pas utiliser Render SQLite local : le disque du service gratuit est éphémère.

## Limites
Ce correctif a été contrôlé statiquement (syntaxe JS), mais aucun compte Neon/Render n'a été créé et aucun test réel de connexion PostgreSQL ou de navigateur n'a été exécuté ici. Il faut tester avant de rendre le site public. Le quota gratuit Neon limite le volume des photos ; surveiller l'espace occupé. L'application reste un petit service familial, pas une plateforme multi-tenant auditée.
