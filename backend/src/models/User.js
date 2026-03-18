import db from '../database.js';

export const findAll = () => {
  return db.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC').all();
};

export const findById = (id) => {
  return db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(id);
};

export const findByEmail = (email) => {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
};

export const create = ({ name, email, password, role = 'visitor' }) => {
  const stmt = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
  const result = stmt.run(name, email, password, role);
  return findById(result.lastInsertRowid);
};

export const update = (id, { name, email, password, role }) => {
  const user = findById(id);
  if (!user) return null;

  const updates = [];
  const values = [];

  if (name !== undefined) { updates.push('name = ?'); values.push(name); }
  if (email !== undefined) { updates.push('email = ?'); values.push(email); }
  if (password !== undefined) { updates.push('password = ?'); values.push(password); }
  if (role !== undefined) { updates.push('role = ?'); values.push(role); }

  if (updates.length === 0) return findById(id);

  values.push(id);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  return findById(id);
};

export const deleteUser = (id) => {
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
  return result.changes > 0;
};
