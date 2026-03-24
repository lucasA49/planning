import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import { rateLimit } from 'express-rate-limit';
import pool, { initDB } from './src/database.js';
import authRoutes from './src/routes/auth.js';
import adminRoutes from './src/routes/admin.js';
import visitorRoutes from './src/routes/visitor.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.set('trust proxy', 1);
app.use(cors({ origin: IS_PROD ? corsOrigin : true }));
app.use(express.json());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Trop de tentatives de connexion, réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', loginLimiter, authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/visitor', visitorRoutes);

if (IS_PROD) {
  const frontendDist = path.join(__dirname, 'public');
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

const seedAdmin = async () => {
  const [rows] = await pool.execute("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  if (rows.length === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    await pool.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Administrateur', 'admin@planning.fr', hashedPassword, 'admin']
    );
    console.log('Admin créé : admin@planning.fr / admin123');
  }
};

app.use((err, req, res, next) => {
  console.error('Express error:', err.message);
  res.status(500).json({ success: false, message: 'Erreur serveur' });
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err.message);
});

app.listen(PORT, async () => {
  console.log(`Serveur démarré sur port ${PORT}`);
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_USER:', process.env.DB_USER);
  console.log('DB_NAME:', process.env.DB_NAME);
  try {
    await initDB();
    console.log('MySQL OK - tables prêtes');
    await seedAdmin();
  } catch (err) {
    console.error('ERREUR MySQL:', err.message);
    console.error('Code erreur:', err.code);
  }
});
