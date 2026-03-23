import pool from '../database.js';

const enrichPlanning = async (planning) => {
  if (!planning) return null;

  const [locRows] = await pool.execute('SELECT * FROM locations WHERE id = ?', [planning.location_id]);
  const [wtRows] = await pool.execute('SELECT * FROM worksite_types WHERE id = ?', [planning.worksite_type_id]);
  const [users] = await pool.execute(`
    SELECT u.id, u.name, u.email, u.role
    FROM users u
    JOIN planning_users pu ON u.id = pu.user_id
    WHERE pu.planning_id = ?
  `, [planning.id]);

  return { ...planning, location: locRows[0] || null, worksiteType: wtRows[0] || null, users };
};

export const findAll = async () => {
  const [plannings] = await pool.execute('SELECT * FROM plannings ORDER BY start_date DESC');
  return Promise.all(plannings.map(enrichPlanning));
};

export const findById = async (id) => {
  const [rows] = await pool.execute('SELECT * FROM plannings WHERE id = ?', [id]);
  return enrichPlanning(rows[0] || null);
};

export const findByDateRange = async (startDate, endDate) => {
  const [plannings] = await pool.execute(
    'SELECT * FROM plannings WHERE start_date <= ? AND end_date >= ? ORDER BY start_date ASC',
    [endDate, startDate]
  );
  return Promise.all(plannings.map(enrichPlanning));
};

export const findByUserId = async (userId, startDate, endDate) => {
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

  const [plannings] = await pool.execute(query, params);
  return Promise.all(plannings.map(enrichPlanning));
};

export const create = async ({ start_date, end_date, location_id, worksite_type_id, notes, day_type }) => {
  const week_start = start_date || null;
  const [result] = await pool.execute(
    'INSERT INTO plannings (week_start, start_date, end_date, location_id, worksite_type_id, notes, day_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [week_start, start_date || null, end_date || null, location_id, worksite_type_id, notes || null, day_type || 'full']
  );
  return findById(result.insertId);
};

export const update = async (id, { start_date, end_date, week_start, location_id, worksite_type_id, notes, day_type }) => {
  const [rows] = await pool.execute('SELECT * FROM plannings WHERE id = ?', [id]);
  if (!rows[0]) return null;

  const updates = [];
  const values = [];

  if (start_date !== undefined) {
    updates.push('start_date = ?'); values.push(start_date);
    updates.push('week_start = ?'); values.push(start_date);
  } else if (week_start !== undefined) {
    updates.push('week_start = ?'); values.push(week_start);
  }
  if (end_date !== undefined) { updates.push('end_date = ?'); values.push(end_date); }
  if (location_id !== undefined) { updates.push('location_id = ?'); values.push(location_id); }
  if (worksite_type_id !== undefined) { updates.push('worksite_type_id = ?'); values.push(worksite_type_id); }
  if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }
  if (day_type !== undefined) { updates.push('day_type = ?'); values.push(day_type); }

  if (updates.length === 0) return findById(id);

  values.push(id);
  await pool.execute(`UPDATE plannings SET ${updates.join(', ')} WHERE id = ?`, values);
  return findById(id);
};

export const deletePlanning = async (id) => {
  const [result] = await pool.execute('DELETE FROM plannings WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

export const addUser = async (planningId, userId) => {
  try {
    await pool.execute('INSERT IGNORE INTO planning_users (planning_id, user_id) VALUES (?, ?)', [planningId, userId]);
    return true;
  } catch {
    return false;
  }
};

export const removeUser = async (planningId, userId) => {
  const [result] = await pool.execute(
    'DELETE FROM planning_users WHERE planning_id = ? AND user_id = ?',
    [planningId, userId]
  );
  return result.affectedRows > 0;
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

export const getAttendanceStats = async (userIds, groupBy) => {
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

  const [rows] = await pool.execute(query, params);
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

export const getDaysWorkedStats = async (startDate, endDate) => {
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

  const [rows] = await pool.execute(query, params);

  const map = {};
  for (const row of rows) {
    if (!map[row.user_id]) map[row.user_id] = { user_id: row.user_id, name: row.name, total_days: 0, plannings_count: 0 };
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
