#!/bin/bash

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Fonction pour afficher les messages
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[ATTENTION]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERREUR]${NC} $1"
}

# Vérification des prérequis
check_prerequisites() {
    print_message "Vérification des prérequis..."
    
    # Vérifier si on est root
    if [ "$EUID" -ne 0 ]; then
        print_error "Ce script doit être exécuté en tant que root (sudo)"
        exit 1
    fi
    
    # Vérifier la connexion Internet
    if ! ping -c 1 google.com &> /dev/null; then
        print_error "Pas de connexion Internet"
        exit 1
    fi
}

# Installation des dépendances système
install_system_dependencies() {
    print_message "Installation des dépendances système..."
    apt update && apt upgrade -y
    apt install -y git curl build-essential postgresql postgresql-contrib libpq-dev python3
}

# Installation de Node.js
install_nodejs() {
    print_message "Installation de Node.js..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    nvm install 18
    nvm use 18
    nvm alias default 18
}

# Configuration de PostgreSQL
setup_postgresql() {
    print_message "Configuration de PostgreSQL..."
    systemctl start postgresql
    systemctl enable postgresql
    
    # Demander les informations de la base de données
    read -p "Nom de la base de données (par défaut: cikatio_prod): " DB_NAME
    DB_NAME=${DB_NAME:-cikatio_prod}
    
    read -p "Nom d'utilisateur PostgreSQL (par défaut: cikatio_user): " DB_USER
    DB_USER=${DB_USER:-cikatio_user}
    
    read -s -p "Mot de passe PostgreSQL: " DB_PASSWORD
    echo
    
    # Créer la base de données et l'utilisateur
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
}

# Configuration de l'application
setup_application() {
    print_message "Configuration de l'application..."
    
    # Créer le répertoire de l'application
    mkdir -p /opt/cikatio
    cd /opt/cikatio
    
    # Cloner le dépôt
    git clone https://github.com/StevenB45/Cikatio.git .
    
    # Créer le fichier .env
    read -p "URL de l'application (ex: https://votre-domaine.com): " APP_URL
    
    # Générer une clé secrète
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    
    cat > .env << EOL
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME?schema=public"
NEXTAUTH_SECRET="$NEXTAUTH_SECRET"
NEXTAUTH_URL="$APP_URL"
EOL
    
    # Installation des dépendances et build
    npm ci
    npx prisma generate
    npx prisma migrate deploy
    rm -rf .next
    rm -rf node_modules/.cache
    npm run build
}

# Configuration de PM2
setup_pm2() {
    print_message "Configuration de PM2..."
    npm install -g pm2
    pm2 start npm --name "cikatio" -- start
    pm2 startup
    pm2 save
}

# Fonction principale
main() {
    print_message "Début du déploiement de Cikatio..."
    
    check_prerequisites
    install_system_dependencies
    install_nodejs
    setup_postgresql
    setup_application
    setup_pm2
    
    print_message "Déploiement terminé avec succès !"
    print_message "Votre application est accessible à l'adresse : $APP_URL"
    print_warning "N'oubliez pas de sauvegarder vos informations de connexion !"
}

# Exécution du script
main 