import pool from '../database.js';

export const findAll = async () => {
  const [rows] = await pool.execute('SELECT * FROM worksite_types ORDER BY name ASC');
  return rows;
};

export const findById = async (id) => {
  const [rows] = await pool.execute('SELECT * FROM worksite_types WHERE id = ?', [id]);
  return rows[0] || null;
};

export const create = async ({ name, description, color }) => {
  const [result] = await pool.execute(
    'INSERT INTO worksite_types (name, description, color) VALUES (?, ?, ?)',
    [name, description || null, color || '#2563eb']
  );
  return findById(result.insertId);
};

export const update = async (id, { name, description, color }) => {
  const existing = await findById(id);
  if (!existing) return null;

  const updates = [];
  const values = [];

  if (name !== undefined) { updates.push('name = ?'); values.push(name); }
  if (description !== undefined) { updates.push('description = ?'); values.push(description); }
  if (color !== undefined) { updates.push('color = ?'); values.push(color); }

  if (updates.length === 0) return findById(id);

  values.push(id);
  await pool.execute(`UPDATE worksite_types SET ${updates.join(', ')} WHERE id = ?`, values);
  return findById(id);
};

export const deleteWorksiteType = async (id) => {
  const [result] = await pool.execute('DELETE FROM worksite_types WHERE id = ?', [id]);
  return result.affectedRows > 0;
};
