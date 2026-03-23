import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import { rateLimit } from 'express-rate-limit';
import db from './src/database.js';
import authRoutes from './src/routes/auth.js';
import adminRoutes from './src/routes/admin.js';
import visitorRoutes from './src/routes/visitor.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';

// CORS
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: IS_PROD ? corsOrigin : true }));

app.use(express.json());

// Rate limiting sur le login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Trop de tentatives de connexion, réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Routes API
app.use('/api/auth', loginLimiter, authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/visitor', visitorRoutes);

// En production : servir le build du frontend (dans backend/public/)
if (IS_PROD) {
  const frontendDist = path.join(__dirname, 'public');
  app.use(express.static(frontendDist));
  // Toutes les routes non-API renvoient index.html (React Router)
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Seed admin par défaut si aucun admin n'existe
const seedAdmin = () => {
  const existingAdmin = db.prepare("SELECT id FROM users WHERE role = 'admin'").get();
  if (!existingAdmin) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
      'Administrateur',
      'admin@planning.fr',
      hashedPassword,
      'admin'
    );
    console.log('Admin créé : admin@planning.fr / admin123 — CHANGEZ LE MOT DE PASSE !');
  }
};

seedAdmin();

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT} [${IS_PROD ? 'production' : 'développement'}]`);
});
