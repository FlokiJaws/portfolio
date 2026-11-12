# Veille Cyber

Mini app de veille cybersécurité, pensée pour l'iPhone (PWA installable sur l'écran d'accueil).
Elle regroupe dans un seul fil les alertes et avis du CERT-FR, le catalogue CISA KEV, les CVE
critiques du NVD et l'actualité sécurité FR + EN, et envoie une notification quand c'est critique.

## Fonctionnement

- **Collecteur** : toutes les 15 minutes, le serveur interroge les sources listées dans `lib/sources.ts`.
  Il tourne dans le même conteneur que l'app (`instrumentation.ts`), sans cron.
- **Stockage** : le Postgres du portfolio, dans un schéma séparé `veille` créé automatiquement.
  Les éléments sont conservés 90 jours (les favoris sont gardés).
- **Critique** : entrée CISA KEV, alerte CERT-FR, CVSS ≥ 9, article signalant une exploitation en
  cours, ou mot-clé suivi (`lib/rules.ts`).
- **Notifications** : Web Push standard. Les clés VAPID sont générées au premier démarrage et
  gardées en base. Au-delà de 3 alertes dans le même passage, elles sont regroupées.
- **Accès** : un mot de passe unique (`VEILLE_PASSWORD`), session d'un an par cookie signé.

## Mise en ligne

1. **DNS** : dans la zone OVH, ajouter un enregistrement `A` `veille` vers l'IP du VPS.
2. **Mot de passe** : sur le VPS, ajouter dans `~/portfolio/.env` (8 caractères minimum) :
   ```
   VEILLE_PASSWORD=un-mot-de-passe-long
   ```
3. **Déployer** : fusionner sur `main` (le workflow lance `docker compose up -d --build`), puis
   recharger Caddy pour qu'il prenne le nouveau domaine :
   ```bash
   docker compose restart caddy
   ```

Optionnel : `NVD_API_KEY` dans `.env` (clé gratuite sur nvd.nist.gov) pour des limites de débit plus larges.

## Installation sur iPhone

1. Ouvrir `https://veille.marleyportfolio.fr` dans **Safari** et se connecter.
2. Partager → **Sur l'écran d'accueil**.
3. Ouvrir l'app depuis l'icône, se reconnecter, puis Réglages → **Activer les notifications**.

Les notifications web demandent iOS 16.4 ou plus, et ne marchent que depuis l'app installée.

## Développement

```bash
npm install
PGHOST=localhost PGUSER=strapi PGPASSWORD=… PGDATABASE=strapi VEILLE_PASSWORD=motdepasse npm run dev
npm test        # parseurs de flux et règles de criticité
```
