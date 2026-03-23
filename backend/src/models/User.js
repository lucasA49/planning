import pool from '../database.js';

export const findAll = async () => {
  const [rows] = await pool.execute('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
  return rows;
};

export const findById = async (id) => {
  const [rows] = await pool.execute('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [id]);
  return rows[0] || null;
};

export const findByIdWithPassword = async (id) => {
  const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] || null;
};

export const findByEmail = async (email) => {
  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
};

export const create = async ({ name, email, password, role = 'visitor' }) => {
  const [result] = await pool.execute(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    [name, email, password, role]
  );
  return findById(result.insertId);
};

export const update = async (id, { name, email, password, role }) => {
  const existing = await findById(id);
  if (!existing) return null;

  const updates = [];
  const values = [];

  if (name !== undefined) { updates.push('name = ?'); values.push(name); }
  if (email !== undefined) { updates.push('email = ?'); values.push(email); }
  if (password !== undefined) { updates.push('password = ?'); values.push(password); }
  if (role !== undefined) { updates.push('role = ?'); values.push(role); }

  if (updates.length === 0) return findById(id);

  values.push(id);
  await pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
  return findById(id);
};

export const deleteUser = async (id) => {
  const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
  return result.affectedRows > 0;
};
