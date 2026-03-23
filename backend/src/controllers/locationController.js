import * as Location from '../models/Location.js';

export const getAll = async (req, res) => {
  const locations = await Location.findAll();
  return res.json({ success: true, data: locations });
};

export const getById = async (req, res) => {
  const location = await Location.findById(parseInt(req.params.id));
  if (!location) {
    return res.status(404).json({ success: false, message: 'Location not found' });
  }
  return res.json({ success: true, data: location });
};

export const create = async (req, res) => {
  const { name, address } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }
  const location = await Location.create({ name, address });
  return res.status(201).json({ success: true, data: location });
};

export const update = async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, address } = req.body;

  const location = await Location.update(id, { name, address });
  if (!location) {
    return res.status(404).json({ success: false, message: 'Location not found' });
  }
  return res.json({ success: true, data: location });
};

export const deleteLocation = async (req, res) => {
  const id = parseInt(req.params.id);
  const deleted = await Location.deleteLocation(id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Location not found' });
  }
  return res.json({ success: true, data: { message: 'Location deleted' } });
};
