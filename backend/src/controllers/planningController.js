import * as Planning from '../models/Planning.js';
import * as User from '../models/User.js';

export const getAll = (req, res) => {
  const { start, end, week } = req.query;
  let plannings;
  if (start && end) {
    plannings = Planning.findByDateRange(start, end);
  } else if (week) {
    // backward compat: treat week as start_date for a 7-day range
    const startDate = week;
    const d = new Date(week + 'T00:00:00');
    d.setDate(d.getDate() + 6);
    const endDate = d.toISOString().split('T')[0];
    plannings = Planning.findByDateRange(startDate, endDate);
  } else {
    plannings = Planning.findAll();
  }
  return res.json({ success: true, data: plannings });
};

export const getById = (req, res) => {
  const planning = Planning.findById(parseInt(req.params.id));
  if (!planning) {
    return res.status(404).json({ success: false, message: 'Planning not found' });
  }
  return res.json({ success: true, data: planning });
};

export const create = (req, res) => {
  const { start_date, end_date, location_id, worksite_type_id, notes, user_ids, day_type } = req.body;

  if (!start_date || !end_date || !location_id || !worksite_type_id) {
    return res.status(400).json({
      success: false,
      message: 'start_date, end_date, location_id and worksite_type_id sont requis'
    });
  }

  if (end_date < start_date) {
    return res.status(400).json({
      success: false,
      message: 'La date de fin doit être égale ou postérieure à la date de début'
    });
  }

  const planning = Planning.create({ start_date, end_date, location_id, worksite_type_id, notes, day_type });

  if (user_ids && Array.isArray(user_ids)) {
    for (const userId of user_ids) {
      Planning.addUser(planning.id, userId);
    }
  }

  const enriched = Planning.findById(planning.id);
  return res.status(201).json({ success: true, data: enriched });
};

export const update = (req, res) => {
  const id = parseInt(req.params.id);
  const { start_date, end_date, location_id, worksite_type_id, notes, user_ids, day_type } = req.body;

  const existing = Planning.findById(id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Planning not found' });
  }

  if (start_date && end_date && end_date < start_date) {
    return res.status(400).json({
      success: false,
      message: 'La date de fin doit être égale ou postérieure à la date de début'
    });
  }

  Planning.update(id, { start_date, end_date, location_id, worksite_type_id, notes, day_type });

  if (user_ids !== undefined && Array.isArray(user_ids)) {
    const currentUserIds = existing.users.map(u => u.id);
    for (const uid of currentUserIds) {
      if (!user_ids.includes(uid)) {
        Planning.removeUser(id, uid);
      }
    }
    for (const uid of user_ids) {
      if (!currentUserIds.includes(uid)) {
        Planning.addUser(id, uid);
      }
    }
  }

  const updated = Planning.findById(id);
  return res.json({ success: true, data: updated });
};

export const deletePlanning = (req, res) => {
  const id = parseInt(req.params.id);
  const deleted = Planning.deletePlanning(id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Planning not found' });
  }
  return res.json({ success: true, data: { message: 'Planning deleted' } });
};

export const addUserToPlanning = (req, res) => {
  const planningId = parseInt(req.params.id);
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ success: false, message: 'user_id is required' });
  }

  const planning = Planning.findById(planningId);
  if (!planning) {
    return res.status(404).json({ success: false, message: 'Planning not found' });
  }

  const user = User.findById(user_id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  Planning.addUser(planningId, user_id);
  const updated = Planning.findById(planningId);
  return res.json({ success: true, data: updated });
};

export const removeUserFromPlanning = (req, res) => {
  const planningId = parseInt(req.params.id);
  const userId = parseInt(req.params.userId);

  const planning = Planning.findById(planningId);
  if (!planning) {
    return res.status(404).json({ success: false, message: 'Planning not found' });
  }

  Planning.removeUser(planningId, userId);
  const updated = Planning.findById(planningId);
  return res.json({ success: true, data: updated });
};

export const getMySchedule = (req, res) => {
  const userId = req.user.id;
  const { start, end, week } = req.query;

  let startDate = start;
  let endDate = end;

  if (!startDate && week) {
    startDate = week;
    const d = new Date(week + 'T00:00:00');
    d.setDate(d.getDate() + 6);
    endDate = d.toISOString().split('T')[0];
  }

  const plannings = Planning.findByUserId(userId, startDate || null, endDate || null);
  return res.json({ success: true, data: plannings });
};

export const getAllPlannings = (req, res) => {
  const { start, end, week } = req.query;
  let plannings;
  if (start && end) {
    plannings = Planning.findByDateRange(start, end);
  } else if (week) {
    const startDate = week;
    const d = new Date(week + 'T00:00:00');
    d.setDate(d.getDate() + 6);
    const endDate = d.toISOString().split('T')[0];
    plannings = Planning.findByDateRange(startDate, endDate);
  } else {
    plannings = Planning.findAll();
  }
  return res.json({ success: true, data: plannings });
};

export const getStats = (req, res) => {
  const { start, end } = req.query;
  const stats = Planning.getDaysWorkedStats(start || null, end || null);
  return res.json({ success: true, data: stats });
};
