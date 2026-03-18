import db from '../database.js';

export const findAll = () => {
  return db.prepare('SELECT * FROM locations ORDER BY name ASC').all();
};

export const findById = (id) => {
  return db.prepare('SELECT * FROM locations WHERE id = ?').get(id);
};

export const create = ({ name, address }) => {
  const stmt = db.prepare('INSERT INTO locations (name, address) VALUES (?, ?)');
  const result = stmt.run(name, address || null);
  return findById(result.lastInsertRowid);
};

export const update = (id, { name, address }) => {
  const location = findById(id);
  if (!location) return null;

  const updates = [];
  const values = [];

  if (name !== undefined) { updates.push('name = ?'); values.push(name); }
  if (address !== undefined) { updates.push('address = ?'); values.push(address); }

  if (updates.length === 0) return findById(id);

  values.push(id);
  db.prepare(`UPDATE locations SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  return findById(id);
};

export const deleteLocation = (id) => {
  const result = db.prepare('DELETE FROM locations WHERE id = ?').run(id);
  return result.changes > 0;
};
