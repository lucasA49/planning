import db from '../database.js';

export const findAll = () => {
  return db.prepare('SELECT * FROM worksite_types ORDER BY name ASC').all();
};

export const findById = (id) => {
  return db.prepare('SELECT * FROM worksite_types WHERE id = ?').get(id);
};

export const create = ({ name, description, color }) => {
  const stmt = db.prepare('INSERT INTO worksite_types (name, description, color) VALUES (?, ?, ?)');
  const result = stmt.run(name, description || null, color || '#2563eb');
  return findById(result.lastInsertRowid);
};

export const update = (id, { name, description, color }) => {
  const wt = findById(id);
  if (!wt) return null;

  const updates = [];
  const values = [];

  if (name !== undefined) { updates.push('name = ?'); values.push(name); }
  if (description !== undefined) { updates.push('description = ?'); values.push(description); }
  if (color !== undefined) { updates.push('color = ?'); values.push(color); }

  if (updates.length === 0) return findById(id);

  values.push(id);
  db.prepare(`UPDATE worksite_types SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  return findById(id);
};

export const deleteWorksiteType = (id) => {
  const result = db.prepare('DELETE FROM worksite_types WHERE id = ?').run(id);
  return result.changes > 0;
};
