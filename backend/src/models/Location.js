import pool from '../database.js';

export const findAll = async () => {
  const [rows] = await pool.execute('SELECT * FROM locations ORDER BY name ASC');
  return rows;
};

export const findById = async (id) => {
  const [rows] = await pool.execute('SELECT * FROM locations WHERE id = ?', [id]);
  return rows[0] || null;
};

export const create = async ({ name, address }) => {
  const [result] = await pool.execute(
    'INSERT INTO locations (name, address) VALUES (?, ?)',
    [name, address || null]
  );
  return findById(result.insertId);
};

export const update = async (id, { name, address }) => {
  const existing = await findById(id);
  if (!existing) return null;

  const updates = [];
  const values = [];

  if (name !== undefined) { updates.push('name = ?'); values.push(name); }
  if (address !== undefined) { updates.push('address = ?'); values.push(address); }

  if (updates.length === 0) return findById(id);

  values.push(id);
  await pool.execute(`UPDATE locations SET ${updates.join(', ')} WHERE id = ?`, values);
  return findById(id);
};

export const deleteLocation = async (id) => {
  const [result] = await pool.execute('DELETE FROM locations WHERE id = ?', [id]);
  return result.affectedRows > 0;
};
