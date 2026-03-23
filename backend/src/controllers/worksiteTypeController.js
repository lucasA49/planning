import * as WorksiteType from '../models/WorksiteType.js';

export const getAll = async (req, res) => {
  const types = await WorksiteType.findAll();
  return res.json({ success: true, data: types });
};

export const getById = async (req, res) => {
  const type = await WorksiteType.findById(parseInt(req.params.id));
  if (!type) {
    return res.status(404).json({ success: false, message: 'Worksite type not found' });
  }
  return res.json({ success: true, data: type });
};

export const create = async (req, res) => {
  const { name, description, color } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }
  const type = await WorksiteType.create({ name, description, color });
  return res.status(201).json({ success: true, data: type });
};

export const update = async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, description, color } = req.body;

  const type = await WorksiteType.update(id, { name, description, color });
  if (!type) {
    return res.status(404).json({ success: false, message: 'Worksite type not found' });
  }
  return res.json({ success: true, data: type });
};

export const deleteWorksiteType = async (req, res) => {
  const id = parseInt(req.params.id);
  const deleted = await WorksiteType.deleteWorksiteType(id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Worksite type not found' });
  }
  return res.json({ success: true, data: { message: 'Worksite type deleted' } });
};
