# Mille Plumes

Plateforme d'écriture et de lecture anonyme, imaginée par Roxane.

## Ce qu'il y a dedans
- `server.js` : serveur Node/Express + API (`/api/...`). Comptes par pseudo (sans e-mail), mot de passe chiffré (bcrypt), session en cookie.
- `db/schema.sql` : tables Postgres (comptes, histoires, chapitres, avis, abonnements, blog, signalements). Appliqué au démarrage.
- `db/seed-data.js` : histoires d'exemple, ajoutées une seule fois si la base est vide (désactiver avec `SEED_DEMO=false`).
- `public/` : le site (installable sur téléphone).
- `test/api.test.js` : test de bout en bout (`npm test`, avec `DATABASE_URL` vers une base de test).

## Règles de sécurité
- Moins de 15 ans : case d'accord parental obligatoire à l'inscription.
- Section Adulte : visible et publiable seulement par les comptes de 18 ans et plus.
- E-mails, numéros de téléphone et comptes de réseaux sociaux bloqués dans les textes.
- Signalements traités par les pseudos listés dans `ADMIN_PSEUDOS` (page « Modération »).

## Variables d'environnement
`DATABASE_URL`, `SESSION_SECRET`, `ADMIN_PSEUDOS` (pseudos séparés par des virgules), `NODE_ENV=production`.

## En local
```
npm install
DATABASE_URL=postgresql://user:pass@localhost/roxane npm start
```
