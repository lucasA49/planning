import * as WorksiteType from '../models/WorksiteType.js';

export const getAll = (req, res) => {
  const types = WorksiteType.findAll();
  return res.json({ success: true, data: types });
};

export const getById = (req, res) => {
  const type = WorksiteType.findById(parseInt(req.params.id));
  if (!type) {
    return res.status(404).json({ success: false, message: 'Worksite type not found' });
  }
  return res.json({ success: true, data: type });
};

export const create = (req, res) => {
  const { name, description, color } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }
  const type = WorksiteType.create({ name, description, color });
  return res.status(201).json({ success: true, data: type });
};

export const update = (req, res) => {
  const id = parseInt(req.params.id);
  const { name, description, color } = req.body;

  const type = WorksiteType.update(id, { name, description, color });
  if (!type) {
    return res.status(404).json({ success: false, message: 'Worksite type not found' });
  }
  return res.json({ success: true, data: type });
};

export const deleteWorksiteType = (req, res) => {
  const id = parseInt(req.params.id);
  const deleted = WorksiteType.deleteWorksiteType(id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Worksite type not found' });
  }
  return res.json({ success: true, data: { message: 'Worksite type deleted' } });
};
