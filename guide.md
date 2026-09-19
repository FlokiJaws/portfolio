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

## 🔜 À venir

### 10. Reverse proxy + HTTPS automatique (Caddy)
**Pourquoi :** un seul point d'entrée sur les ports 80/443 qui redirige vers le bon service en interne, avec un certificat HTTPS généré et renouvelé automatiquement (Let's Encrypt).

### 11. Déployer le site Next.js sur le VPS
**Pourquoi :** faire tourner le portfolio réellement en production, servi via le domaine.

### 12. Choisir et déployer un CMS (Strapi ou Payload) + base de données
**Pourquoi :** permettre d'ajouter/modifier des projets via une interface (formulaire) au lieu d'éditer le code à chaque fois.

### 13. Brancher le frontend sur l'API du CMS
**Pourquoi :** que `data/projects.ts` soit remplacé par des données venant du CMS, affichées dynamiquement.

### 14. Mise en place du redéploiement automatique
**Pourquoi :** que `git push` (ou une modif dans le CMS) mette à jour le site en ligne sans étapes manuelles.
