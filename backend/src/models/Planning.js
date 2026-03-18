import db from '../database.js';

const enrichPlanning = (planning) => {
  if (!planning) return null;

  const location = db.prepare('SELECT * FROM locations WHERE id = ?').get(planning.location_id);
  const worksiteType = db.prepare('SELECT * FROM worksite_types WHERE id = ?').get(planning.worksite_type_id);
  const users = db.prepare(`
    SELECT u.id, u.name, u.email, u.role
    FROM users u
    JOIN planning_users pu ON u.id = pu.user_id
    WHERE pu.planning_id = ?
  `).all(planning.id);

  return { ...planning, location, worksiteType, users };
};

export const findAll = () => {
  const plannings = db.prepare('SELECT * FROM plannings ORDER BY start_date DESC').all();
  return plannings.map(enrichPlanning);
};

export const findById = (id) => {
  const planning = db.prepare('SELECT * FROM plannings WHERE id = ?').get(id);
  return enrichPlanning(planning);
};

export const findByDateRange = (startDate, endDate) => {
  const plannings = db.prepare(
    'SELECT * FROM plannings WHERE start_date <= ? AND end_date >= ? ORDER BY start_date ASC'
  ).all(endDate, startDate);
  return plannings.map(enrichPlanning);
};

// Keep for backward compat
export const findByWeek = (weekStart) => {
  const plannings = db.prepare('SELECT * FROM plannings WHERE week_start = ? ORDER BY id ASC').all(weekStart);
  return plannings.map(enrichPlanning);
};

export const findByUserId = (userId, startDate, endDate) => {
  let query = `
    SELECT p.*
    FROM plannings p
    JOIN planning_users pu ON p.id = pu.planning_id
    WHERE pu.user_id = ?
  `;
  const params = [userId];

  if (startDate && endDate) {
    query += ' AND p.start_date <= ? AND p.end_date >= ?';
    params.push(endDate, startDate);
  }

  query += ' ORDER BY p.start_date DESC';

  const plannings = db.prepare(query).all(...params);
  return plannings.map(enrichPlanning);
};

export const create = ({ start_date, end_date, location_id, worksite_type_id, notes }) => {
  // keep week_start for backward compat, set it = start_date
  const week_start = start_date || null;
  const stmt = db.prepare(
    'INSERT INTO plannings (week_start, start_date, end_date, location_id, worksite_type_id, notes) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const result = stmt.run(week_start, start_date || null, end_date || null, location_id, worksite_type_id, notes || null);
  return findById(result.lastInsertRowid);
};

export const update = (id, { start_date, end_date, week_start, location_id, worksite_type_id, notes }) => {
  const planning = db.prepare('SELECT * FROM plannings WHERE id = ?').get(id);
  if (!planning) return null;

  const updates = [];
  const values = [];

  if (start_date !== undefined) {
    updates.push('start_date = ?');
    values.push(start_date);
    // keep week_start in sync
    updates.push('week_start = ?');
    values.push(start_date);
  } else if (week_start !== undefined) {
    updates.push('week_start = ?');
    values.push(week_start);
  }
  if (end_date !== undefined) { updates.push('end_date = ?'); values.push(end_date); }
  if (location_id !== undefined) { updates.push('location_id = ?'); values.push(location_id); }
  if (worksite_type_id !== undefined) { updates.push('worksite_type_id = ?'); values.push(worksite_type_id); }
  if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }

  if (updates.length === 0) return findById(id);

  values.push(id);
  db.prepare(`UPDATE plannings SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  return findById(id);
};

export const deletePlanning = (id) => {
  const result = db.prepare('DELETE FROM plannings WHERE id = ?').run(id);
  return result.changes > 0;
};

export const addUser = (planningId, userId) => {
  try {
    db.prepare('INSERT OR IGNORE INTO planning_users (planning_id, user_id) VALUES (?, ?)').run(planningId, userId);
    return true;
  } catch {
    return false;
  }
};

export const removeUser = (planningId, userId) => {
  const result = db.prepare('DELETE FROM planning_users WHERE planning_id = ? AND user_id = ?').run(planningId, userId);
  return result.changes > 0;
};

export const getDaysWorkedStats = () => {
  const rows = db.prepare(`
    SELECT u.id as user_id, u.name,
           p.start_date, p.end_date
    FROM users u
    JOIN planning_users pu ON u.id = pu.user_id
    JOIN plannings p ON p.id = pu.planning_id
    WHERE u.role = 'visitor' AND p.start_date IS NOT NULL AND p.end_date IS NOT NULL
    ORDER BY u.name
  `).all();

  // Group by user and sum days
  const map = {};
  for (const row of rows) {
    if (!map[row.user_id]) map[row.user_id] = { user_id: row.user_id, name: row.name, total_days: 0, plannings_count: 0 };
    const start = new Date(row.start_date + 'T00:00:00');
    const end = new Date(row.end_date + 'T00:00:00');
    const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    map[row.user_id].total_days += days;
    map[row.user_id].plannings_count += 1;
  }
  return Object.values(map).sort((a, b) => b.total_days - a.total_days);
};
