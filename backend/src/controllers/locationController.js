import * as Location from '../models/Location.js';

export const getAll = (req, res) => {
  const locations = Location.findAll();
  return res.json({ success: true, data: locations });
};

export const getById = (req, res) => {
  const location = Location.findById(parseInt(req.params.id));
  if (!location) {
    return res.status(404).json({ success: false, message: 'Location not found' });
  }
  return res.json({ success: true, data: location });
};

export const create = (req, res) => {
  const { name, address } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }
  const location = Location.create({ name, address });
  return res.status(201).json({ success: true, data: location });
};

export const update = (req, res) => {
  const id = parseInt(req.params.id);
  const { name, address } = req.body;

  const location = Location.update(id, { name, address });
  if (!location) {
    return res.status(404).json({ success: false, message: 'Location not found' });
  }
  return res.json({ success: true, data: location });
};

export const deleteLocation = (req, res) => {
  const id = parseInt(req.params.id);
  const deleted = Location.deleteLocation(id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Location not found' });
  }
  return res.json({ success: true, data: { message: 'Location deleted' } });
};
