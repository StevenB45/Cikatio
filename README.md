# Cikatio – Plateforme de gestion de prêts

## 🎯 À qui s'adresse ce guide ?
Ce guide est conçu pour tous les niveaux, des débutants aux utilisateurs expérimentés. Si vous êtes nouveau dans le déploiement d'applications web, ne vous inquiétez pas ! Nous avons inclus des explications détaillées pour chaque étape.

## 📋 Prérequis pour comprendre ce guide
- Connaissances de base en ligne de commande (ouvrir un terminal, exécuter des commandes simples)
- Un accès à un serveur Linux (nous expliquerons comment en obtenir un)
- Une connexion Internet stable
- Environ 1-2 heures de temps pour le déploiement complet

## 🚀 Qu'est-ce que Cikatio ?
Cikatio est une application web moderne qui permet de :
- Gérer une bibliothèque ou un inventaire de matériel
- Suivre les prêts et les retours d'objets
- Gérer les utilisateurs et leurs droits d'accès
- Générer des rapports et des statistiques
- Envoyer des notifications automatiques

## 💡 Pourquoi utiliser Cikatio ?
- Interface intuitive et moderne
- Pas besoin de connaissances en programmation pour l'utiliser
- Fonctionne sur tous les navigateurs modernes
- Sécurisé et fiable
- Gratuit et open source

## 🚦 Initialisation de la base de données (compte admin)

Après la configuration et le build, il est recommandé d'initialiser la base avec un compte administrateur par défaut :

```bash
npx prisma db seed
```

Cela créera un compte admin :
- **Email** : admin@cikatio.fr
- **Mot de passe** : Admin123!

Pensez à changer ce mot de passe après la première connexion.

## 🛠️ Déploiement rapide (Recommandé pour les débutants)

Nous avons créé un script de déploiement automatique qui simplifie grandement l'installation. Voici comment l'utiliser :

1. **Préparation du serveur**
   - Connectez-vous à votre serveur via SSH
   - Assurez-vous d'avoir les droits administrateur (sudo)

2. **Téléchargement du script**
   ```bash
   wget https://raw.githubusercontent.com/StevenB45/Cikatio/main/deploy.sh
   chmod +x deploy.sh
   ```

3. **Exécution du script**
   ```bash
   sudo ./deploy.sh
   ```

4. **Suivez les instructions à l'écran**
   - Le script vous guidera à travers chaque étape
   - Il vous demandera les informations nécessaires (mot de passe, URL, etc.)
   - Il installera et configurera tout automatiquement

5. **Initialisation du compte administrateur**
   ```bash
   cd /opt/cikatio
   npx prisma db seed
   ```

Le script s'occupe de :
- Installation des dépendances système
- Configuration de Node.js
- Configuration de la base de données PostgreSQL
- Installation et configuration de l'application
- Configuration du serveur web (Nginx)
- Configuration de HTTPS avec Let's Encrypt

## ⚠️ Résolution des problèmes courants

### Erreurs webpack lors du build
Si vous rencontrez des erreurs liées à webpack (comme des problèmes avec jspdf, xlsx, etc.), exécutez :
```bash
rm -rf .next
rm -rf node_modules/.cache
npm ci
npm run build
```

### Problèmes de mémoire
Si vous avez des erreurs de mémoire lors du build :
```bash
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### Problèmes de connexion à la base de données
```bash
# Vérifier que PostgreSQL est en cours d'exécution
sudo systemctl status postgresql

# Vérifier les logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

## 📝 Guide de déploiement manuel (Pour les utilisateurs avancés)

Si vous préférez déployer manuellement ou si le script automatique ne fonctionne pas, suivez ces étapes :

## Présentation
Cikatio est une application web moderne pour la gestion des prêts de livres et de matériel (équipements) destinée aux bibliothèques, médiathèques, établissements scolaires ou entreprises. Elle permet :
- La gestion des utilisateurs (création, modification, rôles, historique)
- L'inventaire des items (livres, matériel)
- Le suivi des prêts, retours, réservations, retards
- Des statistiques détaillées et exports Excel
- Un système d'authentification sécurisé (mot de passe oublié, réinitialisation)

---

# Guide de déploiement complet sur serveur Linux

## Prérequis matériels et logiciels
Avant de commencer, assurez-vous d'avoir :
- Un serveur Linux (par exemple, Ubuntu 20.04 ou supérieur, Debian 11 ou supérieur)
- Un accès `root` ou un utilisateur avec des privilèges `sudo`
- Une connexion Internet active sur le serveur
- 2 Go de RAM minimum (4 Go recommandés)
- 20 Go d'espace disque minimum

## 🔧 Guide de déploiement pas à pas

### Avant de commencer
1. **Choisir un hébergeur** : Vous aurez besoin d'un serveur Linux. Voici quelques options :
   - OVH (https://www.ovh.com)
   - DigitalOcean (https://www.digitalocean.com)
   - Scaleway (https://www.scaleway.com)
   
   Pour les débutants, nous recommandons OVH ou DigitalOcean qui offrent des interfaces simples.

2. **Choisir un nom de domaine** (optionnel mais recommandé) :
   - Vous pouvez en acheter un sur OVH, Namecheap, ou Google Domains
   - Un nom de domaine rend votre application plus professionnelle et plus facile à retenir

### Étape 1 : Connexion à votre serveur
```bash
# Sur Windows, utilisez PuTTY ou le terminal Windows
# Sur Mac/Linux, utilisez le terminal intégré
ssh utilisateur@adresse_ip_du_serveur
```

### Étape 2 : Installation des outils de base
Les commandes suivantes installent les logiciels nécessaires. Copiez-collez simplement chaque bloc de commandes dans votre terminal :

```bash
# Mise à jour du système (comme mettre à jour votre téléphone)
sudo apt update && sudo apt upgrade -y

# Installation des outils nécessaires
sudo apt install -y git curl build-essential postgresql postgresql-contrib
```

### Étape 3 : Installation de Node.js
Node.js est le moteur qui fait fonctionner Cikatio. Voici comment l'installer :

```bash
# Installation de NVM (gestionnaire de versions de Node.js)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Redémarrage du terminal ou exécution de :
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Installation de Node.js 18 (version stable recommandée)
nvm install 18
nvm use 18
nvm alias default 18
```

## Étape 4 : Configuration de PostgreSQL

```bash
# Démarrage de PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Configuration de la base de données
sudo -u postgres psql
```

Dans le shell PostgreSQL :
```sql
CREATE DATABASE cikatio_prod;
CREATE USER cikatio_user WITH PASSWORD 'votre_mot_de_passe_securise';
GRANT ALL PRIVILEGES ON DATABASE cikatio_prod TO cikatio_user;
\q
```

## Étape 5 : Récupération et configuration du code source

```bash
# Création du répertoire de l'application
mkdir -p /opt/cikatio
cd /opt/cikatio

# Récupération du code source
git clone https://github.com/StevenB45/Cikatio.git .

# Configuration des variables d'environnement
cp .env.example .env
nano .env
```

Configuration minimale du fichier `.env` :
```env
DATABASE_URL="postgresql://cikatio_user:votre_mot_de_passe_securise@localhost:5432/cikatio_prod?schema=public"
NEXTAUTH_SECRET="votre_cle_secrete_generee"
NEXTAUTH_URL="https://votre-domaine.com"
```

## Étape 6 : Installation et construction de l'application

```bash
# Installation des dépendances
npm ci

# Configuration de Prisma
npx prisma generate
npx prisma migrate deploy

# Nettoyage du cache webpack
rm -rf .next
rm -rf node_modules/.cache

# Construction de l'application
npm run build
```

## Étape 7 : Configuration de PM2

```bash
# Installation de PM2
npm install -g pm2

# Démarrage de l'application
pm2 start npm --name "cikatio" -- start

# Configuration du démarrage automatique
pm2 startup
pm2 save
```

## Étape 8 : Configuration de Nginx

```bash
# Installation de Nginx
sudo apt install -y nginx

# Configuration du site
sudo nano /etc/nginx/sites-available/cikatio
```

Configuration Nginx :
```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activation du site :
```bash
sudo ln -s /etc/nginx/sites-available/cikatio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Étape 9 : Configuration HTTPS avec Let's Encrypt

```bash
# Installation de Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtention du certificat SSL
sudo certbot --nginx -d votre-domaine.com
```

## Maintenance et mises à jour

### Mise à jour de l'application
```bash
cd /opt/cikatio
git pull
npm ci
npx prisma generate
npx prisma migrate deploy
rm -rf .next
rm -rf node_modules/.cache
npm run build
pm2 restart cikatio
```

### Logs et surveillance
```bash
# Voir les logs de l'application
pm2 logs cikatio

# Voir le statut de l'application
pm2 status

# Voir les logs Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Sauvegarde de la base de données
```bash
# Création d'une sauvegarde
pg_dump -U cikatio_user cikatio_prod > backup_$(date +%Y%m%d).sql

# Restauration d'une sauvegarde
psql -U cikatio_user cikatio_prod < backup_YYYYMMDD.sql
```

## Dépannage

### Problèmes courants

1. **Erreurs webpack lors du build**
   ```bash
   # Nettoyage complet du cache
   rm -rf .next
   rm -rf node_modules/.cache
   npm ci
   npm run build
   ```

2. **Problèmes de connexion à la base de données**
   ```bash
   # Vérification du service PostgreSQL
   sudo systemctl status postgresql
   
   # Vérification des logs PostgreSQL
   sudo tail -f /var/log/postgresql/postgresql-*.log
   ```

3. **Problèmes de mémoire**
   ```bash
   # Augmentation de la mémoire disponible pour Node.js
   export NODE_OPTIONS="--max-old-space-size=4096"
   ```

### Support et assistance

Pour toute question ou problème, veuillez :
1. Consulter les logs de l'application (`pm2 logs cikatio`)
2. Vérifier les logs Nginx (`/var/log/nginx/error.log`)
3. Vérifier les logs PostgreSQL (`/var/log/postgresql/postgresql-*.log`)
4. Créer une issue sur le dépôt GitHub avec les logs pertinents

---

## Installation locale pour développement/test

Pour une installation locale rapide avec SQLite (idéal pour le développement ou des tests) :

### 1. Installer les dépendances système
- **Linux :** `sudo apt update && sudo apt install -y git curl build-essential sqlite3`
- **macOS :** Assurez-vous d'avoir Xcode Command Line Tools (`xcode-select --install`), Git, Curl. SQLite est généralement inclus.
- **Windows :** Utilisez WSL (Windows Subsystem for Linux) et suivez les instructions Linux.

### 2. Installer Node.js (via nvm)
Suivez les instructions de l'**Étape 3** de l'installation de production.

### 3. Cloner le projet et installer les dépendances
```bash
git clone https://github.com/StevenB45/Cikatio.git
cd Cikatio/cikatio
# Utilise 'npm install' pour le développement local
npm install 
```

### 4. Configurer l'environnement
```bash
cp .env.example .env
# Ouvrez .env et vérifiez que DATABASE_URL pointe vers un fichier SQLite
# La valeur par défaut est généralement correcte : 
# DATABASE_URL="file:./dev.db"
```

### 5. Initialiser la base de données SQLite
```bash
# Crée le fichier de base de données et applique les migrations
npx prisma migrate dev --name init

# Génère le client Prisma
npx prisma generate
```

### 6. Lancer l'application en mode développement
```bash
# Lance le serveur de développement Next.js avec rechargement à chaud
npm run dev
```
L'application sera accessible sur `http://localhost:3000`.

---

## Création d'un compte administrateur
Une fois l'application lancée (en production ou localement) :
1. Accédez à l'application dans votre navigateur (`http://localhost:3000` ou l'URL de votre serveur).
2. La première page devrait être celle de connexion/inscription. Créez un premier compte.
3. **Important :** Pour l'instant, la création du rôle ADMIN n'est pas automatique. Vous devrez modifier manuellement le rôle de votre utilisateur directement dans la base de données ou implémenter une logique de seeding pour le premier utilisateur.
   *Alternative (si l'interface le permet)* :
   1. Connectez-vous avec le compte créé.
   2. Accédez (si possible) à la section "Utilisateurs".
   3. Modifiez votre propre utilisateur et changez son rôle en "ADMIN".
   *(Cette section du README pourrait nécessiter une mise à jour basée sur les fonctionnalités exactes de l'interface utilisateur pour la gestion des rôles)*

---

## Déploiement/maintenance (avec PM2)
- Pour mettre à jour l'application en production :
```bash
cd /chemin/vers/Cikatio/cikatio # Assurez-vous d'être dans le bon dossier
git pull # Récupère les dernières modifications du code
npm ci   # Met à jour les dépendances
npx prisma migrate deploy # Applique les nouvelles migrations de base de données s'il y en a
npx prisma generate     # Regénère le client Prisma
npm run build         # Recompile l'application
pm2 restart cikatio  # Redémarre l'application via PM2 sans interruption majeure
```
- Pour consulter les logs de l'application gérée par PM2 :
```bash
pm2 logs cikatio
```
- Pour arrêter l'application :
```bash
pm2 stop cikatio
```
- Pour la redémarrer :
```bash
pm2 restart cikatio
```
- Pour supprimer l'application de PM2 :
```bash
pm2 delete cikatio
pm2 save # Sauvegarde la nouvelle liste (sans cikatio)
```

---

## Dépannage
- **Vérifiez les versions :** `node -v`, `npm -v`, `psql --version`
- **Vérifiez la connexion à PostgreSQL :** `psql -U cikatio_user -d cikatio_prod -h localhost` (entrez le mot de passe lorsque demandé)
- **Consultez les logs PM2 :** `pm2 logs cikatio`
- **Consultez les logs système :** `journalctl -u postgresql` (pour les erreurs PostgreSQL)
- **Problèmes de build :** Supprimez `node_modules` et `.next` et réessayez `npm ci` et `npm run build`.
- **Documentation :**
  - Node.js : https://nodejs.org/
  - Prisma : https://www.prisma.io/docs/
  - Next.js : https://nextjs.org/docs
  - PostgreSQL : https://www.postgresql.org/docs/
  - PM2 : https://pm2.keymetrics.io/docs/usage/pm2-doc-single-page/
- **Ouvrez une issue sur GitHub** si vous êtes bloqué : https://github.com/StevenB45/Cikatio/issues

---

## Sécurité & bonnes pratiques
- **Mot de passe PostgreSQL :** Utilisez un mot de passe fort et unique pour `cikatio_user`.
- **Variables d'environnement :** Ne commitez jamais votre fichier `.env` contenant des secrets dans Git. Assurez-vous que `.env` est dans votre fichier `.gitignore`.
- **HTTPS :** Configurez un reverse proxy (comme Nginx ou Traefik) devant votre application Node.js pour gérer le HTTPS (SSL/TLS), les en-têtes de sécurité, et potentiellement la mise en cache ou la limitation de débit.
- **Pare-feu :** Configurez un pare-feu (comme `ufw`) sur votre serveur pour n'autoriser que les ports nécessaires (ex: 80 pour HTTP, 443 pour HTTPS, 22 pour SSH).
- **Sauvegardes :** Mettez en place des sauvegardes régulières de votre base de données PostgreSQL (`pg_dump`).
- **Mises à jour :** Maintenez votre serveur Linux, Node.js, PostgreSQL, et les dépendances `npm` à jour pour corriger les failles de sécurité.

---

## Liens utiles
- Dépôt GitHub : https://github.com/StevenB45/Cikatio
- Documentation Prisma : https://www.prisma.io/docs/
- Documentation Next.js : https://nextjs.org/docs

## ❓ Questions fréquentes

### Comment savoir si l'installation a réussi ?
1. Ouvrez votre navigateur
2. Visitez l'adresse de votre serveur (par exemple : https://votre-domaine.com)
3. Vous devriez voir la page de connexion de Cikatio

### Que faire si quelque chose ne fonctionne pas ?
1. Vérifiez les logs de l'application :
   ```bash
   pm2 logs cikatio
   ```
2. Vérifiez que tous les services sont en cours d'exécution :
   ```bash
   pm2 status
   sudo systemctl status nginx
   sudo systemctl status postgresql
   ```

### Comment mettre à jour l'application ?
```bash
cd /opt/cikatio
git pull
npm ci
npx prisma generate
npx prisma migrate deploy
rm -rf .next
rm -rf node_modules/.cache
npm run build
pm2 restart cikatio
```

## 📞 Besoin d'aide ?
- Consultez la documentation : https://github.com/StevenB45/Cikatio
- Ouvrez une issue sur GitHub : https://github.com/StevenB45/Cikatio/issues
- Contactez le support : [votre-email@exemple.com]

## Configuration de l'Environnement

### Variables d'Environnement

1. Copiez le fichier d'exemple :
```bash
cp .env.example .env
```

2. Configurez les variables dans `.env` :
```env
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/database?schema=public"

# NextAuth
NEXTAUTH_SECRET="generate-a-secure-random-string"
NEXTAUTH_URL="http://localhost:3000"

# Email (optionnel)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="user@example.com"
SMTP_PASSWORD="your-smtp-password"
```

⚠️ **IMPORTANT** :
- Ne commitez JAMAIS le fichier `.env` dans Git
- Utilisez des mots de passe forts et uniques
- Générez une clé secrète sécurisée pour NEXTAUTH_SECRET
- En production, utilisez des variables d'environnement sécurisées

### Création de l'Administrateur

Pour créer un compte administrateur, utilisez le script :
```bash
npm run create-admin
```

⚠️ **Sécurité** :
- Changez immédiatement le mot de passe par défaut
- Utilisez une adresse email sécurisée
- Activez l'authentification à deux facteurs si possible

## Développement

### Installation

```bash
npm install
```

### Base de données

1. Configuration de développement :
```bash
# Utilisez SQLite pour le développement
DATABASE_URL="file:./dev.db"
```

2. Migrations :
```bash
npx prisma migrate dev
```

### Démarrage

```bash
npm run dev
```

## Production

### Déploiement

1. Build :
```bash
npm run build
```

2. Démarrage :
```bash
npm start
```

### Sécurité

- Utilisez HTTPS
- Configurez des en-têtes de sécurité
- Activez la protection CSRF
- Mettez en place une politique de mots de passe forte
- Limitez les tentatives de connexion
- Surveillez les logs d'accès

## Support

Pour toute question ou problème :
- Consultez la documentation
- Ouvrez une issue sur GitHub
- Contactez l'équipe de support

## Licence

[Votre licence]
