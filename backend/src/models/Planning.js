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

export const create = ({ start_date, end_date, location_id, worksite_type_id, notes, day_type }) => {
  // keep week_start for backward compat, set it = start_date
  const week_start = start_date || null;
  const stmt = db.prepare(
    'INSERT INTO plannings (week_start, start_date, end_date, location_id, worksite_type_id, notes, day_type) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const result = stmt.run(week_start, start_date || null, end_date || null, location_id, worksite_type_id, notes || null, day_type || 'full');
  return findById(result.lastInsertRowid);
};

export const update = (id, { start_date, end_date, week_start, location_id, worksite_type_id, notes, day_type }) => {
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
  if (day_type !== undefined) { updates.push('day_type = ?'); values.push(day_type); }

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

const workingDaysInMonth = (yearMonth) => {
  const [y, m] = yearMonth.split('-').map(Number);
  let count = 0;
  const d = new Date(y, m - 1, 1);
  while (d.getMonth() === m - 1) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
};

export const getAttendanceStats = (userIds, groupBy) => {
  let query = `
    SELECT u.id as user_id, u.name,
           p.start_date, p.end_date, p.day_type
    FROM users u
    JOIN planning_users pu ON u.id = pu.user_id
    JOIN plannings p ON p.id = pu.planning_id
    WHERE u.role = 'visitor' AND p.start_date IS NOT NULL AND p.end_date IS NOT NULL
  `;
  const params = [];
  if (userIds && userIds.length > 0) {
    query += ` AND u.id IN (${userIds.map(() => '?').join(',')})`;
    params.push(...userIds);
  }

  const rows = db.prepare(query).all(...params);
  const periodMap = {};

  for (const row of rows) {
    const start = new Date(row.start_date + 'T00:00:00');
    const end = new Date(row.end_date + 'T00:00:00');
    const dayCount = Math.round((end - start) / 86400000) + 1;
    const multiplier = (row.day_type === 'morning' || row.day_type === 'afternoon') ? 0.5 : 1;
    const days = dayCount * multiplier;

    let periodKey;
    if (groupBy === 'week') {
      const d = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
      periodKey = `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
    } else {
      periodKey = row.start_date.slice(0, 7);
    }

    if (!periodMap[periodKey]) {
      periodMap[periodKey] = {
        period: periodKey,
        working_days: groupBy === 'week' ? 5 : workingDaysInMonth(periodKey),
        workers: {}
      };
    }
    if (!periodMap[periodKey].workers[row.user_id]) {
      periodMap[periodKey].workers[row.user_id] = { user_id: row.user_id, name: row.name, days: 0 };
    }
    periodMap[periodKey].workers[row.user_id].days += days;
  }

  return Object.keys(periodMap).sort().map(p => ({
    ...periodMap[p],
    workers: Object.values(periodMap[p].workers)
  }));
};

export const getDaysWorkedStats = (startDate, endDate) => {
  let query = `
    SELECT u.id as user_id, u.name,
           p.start_date, p.end_date, p.day_type
    FROM users u
    JOIN planning_users pu ON u.id = pu.user_id
    JOIN plannings p ON p.id = pu.planning_id
    WHERE u.role = 'visitor' AND p.start_date IS NOT NULL AND p.end_date IS NOT NULL
  `;
  const params = [];

  if (startDate && endDate) {
    query += ' AND p.start_date <= ? AND p.end_date >= ?';
    params.push(endDate, startDate);
  }

  query += ' ORDER BY u.name';

  const rows = db.prepare(query).all(...params);

  const map = {};
  for (const row of rows) {
    if (!map[row.user_id]) map[row.user_id] = { user_id: row.user_id, name: row.name, total_days: 0, plannings_count: 0 };
    // Clip dates to the filter period
    const effectiveStart = startDate && row.start_date < startDate ? startDate : row.start_date;
    const effectiveEnd = endDate && row.end_date > endDate ? endDate : row.end_date;
    const start = new Date(effectiveStart + 'T00:00:00');
    const end = new Date(effectiveEnd + 'T00:00:00');
    const dayCount = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    if (dayCount > 0) {
      const multiplier = (row.day_type === 'morning' || row.day_type === 'afternoon') ? 0.5 : 1;
      map[row.user_id].total_days += dayCount * multiplier;
      map[row.user_id].plannings_count += 1;
    }
  }
  return Object.values(map).sort((a, b) => b.total_days - a.total_days);
};
