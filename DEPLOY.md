# Déploiement Hostinger VPS — connecté à GitHub

## Vue d'ensemble

```
Vous poussez sur GitHub  →  VPS fait git pull  →  deploy.sh rebuild + restart
```

---

## 1. Préparation du VPS (une seule fois)

Connectez-vous en SSH :
```bash
ssh root@VOTRE_IP_HOSTINGER
```

### Installer Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node -v   # v20.x.x
```

### Installer PM2 et nginx
```bash
npm install -g pm2
apt-get install -y nginx git
```

### Créer le dossier de logs
```bash
mkdir -p /var/log/planning-app
```

---

## 2. Premier déploiement

### Cloner le repo GitHub
```bash
cd /var/www
git clone https://github.com/VOTRE-USER/VOTRE-REPO.git planning-app
cd planning-app
```

### Créer le fichier .env
```bash
cp backend/.env.example backend/.env
nano backend/.env
```

Remplissez avec vos vraies valeurs :
```
PORT=3001
JWT_SECRET=     ← générez avec : openssl rand -base64 32
CORS_ORIGIN=https://votre-domaine.com
NODE_ENV=production
```

### Lancer le déploiement initial
```bash
chmod +x deploy.sh
./deploy.sh
```

### Configurer nginx
```bash
# Remplacer votre-domaine.com dans le fichier
sed -i 's/votre-domaine.com/VOTRE_VRAI_DOMAINE/g' nginx.conf

cp nginx.conf /etc/nginx/sites-available/planning-app
ln -s /etc/nginx/sites-available/planning-app /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### Démarrer PM2 au boot du serveur
```bash
pm2 startup
# Copier-coller la commande affichée, puis :
pm2 save
```

**L'app est en ligne sur http://votre-domaine.com** ✅

---

## 3. Activer HTTPS (Let's Encrypt) — recommandé

```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d votre-domaine.com -d www.votre-domaine.com
```

---

## 4. Workflow quotidien — mettre à jour l'app

Depuis votre machine locale, poussez sur GitHub normalement :
```bash
git add .
git commit -m "ma modif"
git push
```

Ensuite sur le VPS :
```bash
cd /var/www/planning-app
git pull
./deploy.sh
```

> Si vous voulez automatiser ce `git pull + deploy.sh`, vous pouvez configurer un **webhook GitHub** (voir section optionnelle ci-dessous).

---

## 5. (Optionnel) Auto-déploiement via webhook GitHub

Sur le VPS, créez `/var/www/webhook.js` :
```js
import { createServer } from 'http';
import { exec } from 'child_process';

createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/deploy') {
    exec('cd /var/www/planning-app && git pull && ./deploy.sh', (err, stdout) => {
      console.log(stdout);
      if (err) console.error(err);
    });
    res.end('OK');
  } else {
    res.writeHead(404); res.end();
  }
}).listen(9000, () => console.log('Webhook sur port 9000'));
```

Lancez-le avec PM2 :
```bash
pm2 start /var/www/webhook.js --name webhook
pm2 save
```

Dans GitHub → Settings → Webhooks → Add webhook :
- **Payload URL** : `http://votre-domaine.com:9000/deploy`
- **Content type** : `application/json`
- **Events** : Just the push event

---

## Compte admin par défaut

Au premier démarrage :
- **Email** : admin@planning.fr
- **Mot de passe** : admin123

**⚠️ Changez le mot de passe immédiatement dans Mon compte.**

---

## Commandes utiles sur le VPS

```bash
pm2 status                    # état des processus
pm2 logs planning-app         # logs en direct
pm2 restart planning-app      # redémarrer sans deploy.sh
nginx -t                      # vérifier la config nginx
systemctl status nginx        # état de nginx
```
