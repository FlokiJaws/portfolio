# Guide de déploiement — marleyportfolio.fr

Suivi des étapes pour héberger le portfolio sur un VPS OVH avec nom de domaine perso. Mis à jour au fur et à mesure.

## ✅ Fait

### 1. Nom de domaine
Achat de `marleyportfolio.fr` chez OVH (DNSSEC activé, gratuit ; option email Zimbra retirée, inutile).
**Pourquoi :** avoir une adresse propre plutôt qu'une URL Vercel générique — identité, professionnalisme pour un CV.

### 2. VPS OVH
Commande d'un **VPS-1** (2 vCore, 4 Go RAM, 40 Go SSD NVMe), datacenter Strasbourg, image **Ubuntu 24.04 LTS**, backup automatisé inclus (offert).
**Pourquoi :** un vrai serveur qu'on administre nous-mêmes — nécessaire pour faire tourner Docker, le site, et un CMS avec base de données. Largement suffisant pour un portfolio à faible trafic.

### 3. Première connexion SSH
Connexion initiale via `ssh ubuntu@<IP>` avec le mot de passe fourni par OVH (généré depuis le Manager OVH, plus fiable que l'email).
**Pourquoi :** premier accès au serveur pour pouvoir le configurer.

### 4. Mise à jour du système
```bash
sudo apt update && sudo apt upgrade -y
sudo reboot
```
**Pourquoi :** partir sur un système à jour, avec les derniers correctifs de sécurité.

### 5. Authentification par clé SSH
Génération d'une paire de clés SSH sur la machine locale (`ssh-keygen -t ed25519`), envoi de la clé publique au VPS (`~/.ssh/authorized_keys` de l'utilisateur `ubuntu`).
**Pourquoi :** se connecter sans mot de passe, de façon plus sûre (une clé privée est bien plus difficile à deviner/forcer qu'un mot de passe).

### 6. Durcissement SSH
Dans `/etc/ssh/sshd_config` :
```
PermitRootLogin no
PasswordAuthentication no
```
puis `sudo systemctl restart ssh`.
**Pourquoi :** empêche toute connexion root directe et bloque les tentatives par mot de passe (cible n°1 des bots qui scannent le net en continu) — seule la clé SSH permet désormais de se connecter.

### 7. Pare-feu (ufw)
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```
**Pourquoi :** ferme tous les ports sauf ceux réellement utilisés (SSH, HTTP, HTTPS) — réduit la surface d'attaque du serveur.

### 8. Pointer le domaine vers le VPS
Enregistrement DNS **A** de `marleyportfolio.fr` (+ `www`) vers `51.91.76.214`, dans la zone DNS OVH.
**Pourquoi :** faire en sorte que taper `marleyportfolio.fr` dans un navigateur atteigne bien ce serveur.
**Vérifié :** `nslookup marleyportfolio.fr` renvoie bien `51.91.76.214`.

---

### 9. Installer Docker + Docker Compose sur le VPS
```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
```
**Pourquoi :** faire tourner plusieurs services isolés (le site, le CMS, la base de données) de façon reproductible, sans les installer "en dur" sur le système.
**Vérifié :** Docker 29.8.1, Docker Compose v5.5.1.

---

### 10. Reverse proxy + HTTPS automatique (Caddy)
`Dockerfile` (build multi-étapes Next.js en mode `standalone`), `docker-compose.yml` (services `app` + `caddy`), `Caddyfile` (reverse proxy vers `app:3000`).
**Pourquoi :** un seul point d'entrée sur les ports 80/443 qui redirige vers le bon service en interne, avec un certificat HTTPS généré et renouvelé automatiquement (Let's Encrypt).

### 11. Déployer le site Next.js sur le VPS
```bash
git clone https://github.com/FlokiJaws/portfolio.git
cd portfolio
docker compose up -d --build
```
**Pourquoi :** faire tourner le portfolio réellement en production, servi via le domaine.
**Vérifié :** https://marleyportfolio.fr accessible avec HTTPS.

### 12. Redéploiement automatique (CI/CD avec GitHub Actions)
Clé SSH dédiée (`deploy_portfolio`) ajoutée au VPS, secrets `VPS_SSH_KEY`/`VPS_HOST`/`VPS_USER` sur GitHub, workflow `.github/workflows/deploy.yml` (déclenché sur push vers `main`, se connecte en SSH et relance `git pull && docker compose up -d --build`).
**Pourquoi :** qu'un `git push` sur `main` mette à jour le site en ligne tout seul, sans reconnexion manuelle au VPS.
**Vérifié :** premier déploiement automatique passé en vert dans l'onglet Actions de GitHub.

### 13. CMS Strapi + PostgreSQL
Projet Strapi scaffoldé dans `cms/` (TypeScript, préconfiguré pour Postgres via variables d'env). `cms/Dockerfile`, services `postgres` et `strapi` ajoutés à `docker-compose.yml`, bloc `cms.marleyportfolio.fr` ajouté au `Caddyfile`. Les secrets Strapi vivent uniquement dans `cms/.env` (jamais commité, créé à la main sur le VPS).
**Pourquoi :** interface d'administration pour ajouter/modifier des projets (titre, description...) sans toucher au code.
**Vérifié :** admin accessible sur https://cms.marleyportfolio.fr/admin (création du compte admin au premier accès).

### 13b. Modèle "Project" (Content-Type)
Créé **en local** puis poussé sur Git : `cms/src/api/project/` (schéma + routes/contrôleur/service générés) et `cms/types/`. Champs : `title`, `slug`, `description`, `details`, `highlights` (un point par ligne), `note`, `context`, `year`, `tags` (séparés par des virgules), `image` (média), `liveUrl`, `repoUrl`, `repoPrivate`.
```bash
cd cms
DATABASE_CLIENT=sqlite DATABASE_FILENAME=.tmp/data.db npm run develop   # http://localhost:1337/admin
```
**Pourquoi en local :** le Content-Type Builder est désactivé en production (Strapi tourne en `NODE_ENV=production` sur le VPS). On modélise en dev (base SQLite jetable, `better-sqlite3` installé en local uniquement, non commité), on commit le schéma généré, et la prod le récupère au redéploiement.
**Bon à savoir :**
- `draftAndPublish` est activé : un projet reste **invisible** de l'API tant qu'on n'a pas cliqué **Publish**.
- Les permissions se règlent directement en prod : *Settings → Users & Permissions → Roles → Public → Project → `find` + `findOne`*.
- Les données (les projets) vivent dans le Postgres du VPS ; le SQLite local ne sert qu'à modéliser.

### 14. Brancher le frontend sur l'API du CMS
`frontend/lib/cms.ts` (`getProjects()` : appelle `/api/projects?populate=image` et convertit la réponse Strapi vers le type `Project`), `/simple` devenu asynchrone (rendu serveur, revalidation toutes les 60 s), `/terminal` qui charge les projets côté client. `data/projects.ts` ne garde plus que le type. L'URL du CMS est passée au build Docker (`NEXT_PUBLIC_CMS_URL`, figée dans le bundle au build, d'où l'`ARG` dans le `Dockerfile` et `args` dans `docker-compose.yml`).
**Pourquoi :** ajouter ou modifier un projet dans Strapi le fait apparaître sur le site en ~1 minute, sans code ni redéploiement.

### 15. Finitions partage / SEO
- `app/opengraph-image.tsx` : image d'aperçu (1200×630) générée par code avec `next/og`, affichée quand on partage le lien (LinkedIn, Discord...). Reprend la palette et lit nom + accroche dans `data/profile.ts`.
- `app/icon.tsx` : favicon généré par code (`>_`), à la place du favicon Next.js par défaut.
- `app/not-found.tsx` : page 404 dans le style terminal, avec liens de retour.
- `app/layout.tsx` : `<html lang="fr">`, `metadataBase`, titres avec gabarit (`Version simplifiée | Marley`), balises OpenGraph/Twitter ; titres d'onglet pour `/simple` et `/terminal`.
- Nettoyage de `public/` (SVG de démo Next.js, ancien logo). Le dossier est conservé via `public/.gitkeep` : le `Dockerfile` fait un `COPY /app/public`, sans dossier le build de production échouerait.
**Pourquoi :** un lien partagé affiche un vrai aperçu, l'onglet a une identité, et le site déclare la bonne langue.

---

## 🔜 À venir / pistes

- Enrichir la fiche « Portfolio » (VPS, Docker, Caddy, CI/CD, Strapi) : bon argument CV.
- Sauvegarde du volume Postgres du VPS (les projets ne sont pas dans Git).
- Photos/captures de projets via la médiathèque Strapi (champ `image` déjà prêt).
