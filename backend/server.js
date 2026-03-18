import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import db from './src/database.js';
import authRoutes from './src/routes/auth.js';
import adminRoutes from './src/routes/admin.js';
import visitorRoutes from './src/routes/visitor.js';

const app = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/visitor', visitorRoutes);

// Seed admin user if not exists
const seedAdmin = () => {
  const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@planning.fr');
  if (!existingAdmin) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
      'Administrateur',
      'admin@planning.fr',
      hashedPassword,
      'admin'
    );
    console.log('Admin user seeded: admin@planning.fr / admin123');
  }
};

seedAdmin();

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
